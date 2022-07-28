"use strict";

import * as usersController from "./users.controller";
import Block from "../models/block.model";
import FollowRequest from "../models/follow-request.model";
import Follow from "../models/follow.model";
import { RequestHandler } from "express";

export const followUser: RequestHandler = async (req, res, next) => {
	const followeeHandle = req.params.handle;
	const { handle: followerHandle, userId: followerUserId } = req.userInfo as UserInfo;
	if (followeeHandle === followerHandle) {
		res.status(422).send("User cannot follow themselves");
		return;
	}
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
	const model = isFolloweeProtected
		? new FollowRequest({
				user: followeeUserId,
				requestedBy: followerUserId
		  })
		: new Follow({
				user: followeeUserId,
				followedBy: followerUserId
		  });
	const result = await model.save();
	res.status(200).json({
		[isFolloweeProtected ? "requested" : "followed"]: result
	});
};
export const unfollowUser: RequestHandler = async (req, res, next) => {
	const unfolloweeHandle = req.params.handle;
	const { handle: unfollowerHandle, userId: unfollowerUserId } = req.userInfo as UserInfo;
	if (unfolloweeHandle === unfollowerHandle) {
		res.status(422).send("User cannot unfollow themselves");
		return;
	}
	const unfollowee = await usersController.findUserByHandle(unfolloweeHandle);
	if (!unfollowee) {
		res.status(404).send("User not found");
		return;
	}
	const unfollowed = await Follow.findOneAndDelete({ user: unfollowee._id, followedBy: unfollowerUserId });
	res.status(200).json({ unfollowed });
};