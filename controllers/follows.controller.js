"use strict";

const usersController = require("./users.controller");
const Block = require("../models/block.model");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");

const followUser = async (req, res, next) => {
	const followeeHandle = req.params.handle;
	const { handle: followerHandle, userId: followerUserId } = req.userInfo;
	if (followeeHandle === followerHandle) {
		res.status(422).send("User cannot follow themselves");
		return;
	}
	try {
		const followee = await usersController.findActiveUserByHandle(followeeHandle);
		if (!followee) {
			res.status(404).send("User not found");
			return;
		}
		const followeeUserId = followee._id;
		if (await Block.countDocuments({ user: followerUserId, blockedBy: followeeUserId })) {
			res.status(403).send("User has blocked you from following them");
			return;
		}
		if (await Block.countDocuments({ user: followeeUserId, blockedBy: followerUserId })) {
			res.status(403).send("Unblock this user to start following them");
			return;
		}
		const isFolloweeProtected = followee.protected;
		const model = isFolloweeProtected ? new FollowRequest({
				user: followeeUserId,
				requestedBy: followerUserId
			}) : new Follow({
				user: followeeUserId,
				followedBy: followerUserId
			});
		const result = await model.save();
		res.status(200).json({
			[isFolloweeProtected ? "requested" : "followed"]: result
		});
	} catch (err) {
		next(err);
	}
};
const unfollowUser = async (req, res, next) => {
	const unfolloweeHandle = req.params.handle;
	const { handle: unfollowerHandle, userId: unfollowerUserId } = req.userInfo;
	if (unfolloweeHandle === unfollowerHandle) {
		res.status(422).send("User cannot unfollow themselves");
		return;
	}
	try {
		const unfollowee = await usersController.findUserByHandle(unfolloweeHandle);
		if (!unfollowee) {
			res.status(404).send("User not found");
			return;
		}
		const unfollowed = await Follow.findOneAndDelete({ user: unfollowee._id, followedBy: unfollowerUserId });
		res.status(200).json({ unfollowed });
	} catch (err) {
		next(err);
	}
};

module.exports = { followUser, unfollowUser };