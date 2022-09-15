"use strict";

import mongoose from "mongoose";
import * as usersController from "./users.controller";
import Block from "../models/block.model";
import User from "../models/user.model";
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
		res.status(403).send("Unblock this user before trying to follow them");
		return;
	}
	if (followee.protected) {
		const requested = await new FollowRequest({
			user: followeeUserId,
			requestedBy: followerUserId
		}).save();
		res.status(200).json({ requested });
		return;
	}
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const followed = await new Follow({
				user: followeeUserId,
				followedBy: followerUserId
			}).save({ session });
			await User.findByIdAndUpdate(followerUserId, {
				$addToSet: {
					follows: followeeUserId
				}
			}).session(session);
			res.status(200).json({ followed });
		});
	} finally {
		await session.endSession();
	}
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
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unfolloweeUserId = unfollowee._id;
			const unfollowed = await Follow.findOneAndDelete({ user: unfolloweeUserId, followedBy: unfollowerUserId }).session(session);
			if (unfollowed) {
				await User.findByIdAndUpdate(unfollowerUserId, {
					$pull: {
						follows: unfolloweeUserId
					}
				}).session(session);
			}
			res.status(200).json({ unfollowed });
		});
	} finally {
		await session.endSession();
	}
};