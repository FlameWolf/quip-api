"use strict";

const generalController = require("./general.controller");
const usersController = require("./users.controller");
const Block = require("../models/block.model");
const Follow = require("../models/favourite.model");

const followUser = (req, res, next) => {
	const followUserAction = "Follow user";
	const followeeHandle = req.params.handle;
	const followerHandle = req.userInfo.handle;
	const followerUserId = req.userInfo.userId;
	if (followeeHandle === followerHandle) {
		generalController.failureResponse(res, 422, followUserAction, "User cannot follow themselves");
		return;
	}
	try {
		const followee = await usersController.findActiveUserByHandle(followeeHandle);
		if (!followee) {
			generalController.failureResponse(res, 404, followUserAction, "User not found");
			return;
		}
		const followeeUserId = followee._id;
		const blocked = Block.findOne({ user: followerUserId, blockedBy: followeeUserId });
		if (blocked) {
			generalController.failureResponse(res, 403, followUserAction, "User has blocked you from following them");
			return;
		}
		const followResult = await new Follow({ user: followeeUserId, followedBy: followerUserId }).save();
		generalController.successResponse(res, 200, followUserAction, followResult);
	} catch (err) {
		generalController.failureResponse(res, 500, followUserAction, err.message);
	}
};
const unfollowUser = (req, res, next) => {
	const unfollowUserAction = "Unfollow user";
	const unfolloweeHandle = req.params.handle;
	const unfollowerHandle = req.userInfo.handle;
	const unfollowerUserId = req.userInfo.userId;
	if (unfolloweeHandle === unfollowerHandle) {
		generalController.failureResponse(res, 422, unfollowUserAction, "User cannot unfollow themselves");
		return;
	}
	try {
		const unfollowee = await usersController.findActiveUserByHandle(unfolloweeHandle);
		if (!unfollowee) {
			generalController.failureResponse(res, 404, unfollowUserAction, "User not found");
			return;
		}
		const unfollowResult = await Follow.findOneAndDelete({ user: unfollowee._id, followedBy: unfollowerUserId });
		generalController.successResponse(res, 200, unfollowUserAction, unfollowResult);
	} catch (err) {
		generalController.failureResponse(res, 500, unfollowUserAction, err.message);
	}
};

module.exports = { followUser, unfollowUser };