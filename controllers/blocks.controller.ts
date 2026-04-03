"use strict";

import mongoose from "mongoose";
import FollowRequest from "../models/follow-request.model.ts";
import Follow from "../models/follow.model.ts";
import List from "../models/list.model.ts";
import ListMember from "../models/list-member.model.ts";
import User from "../models/user.model.ts";
import Block from "../models/block.model.ts";
import * as usersController from "./users.controller.ts";
import type { RequestHandler } from "express";

export const blockUser: RequestHandler = async (req, res, next) => {
	const blockeeHandle = req.params.handle;
	const blockReason = req.query.reason;
	const { handle: blockerHandle, userId: blockerUserId } = req.userInfo as UserInfo;
	if (blockeeHandle === blockerHandle) {
		res.status(422).send("User cannot block themselves");
		return;
	}
	const session = await mongoose.startSession();
	try {
		const blockee = await usersController.findActiveUserByHandle(blockeeHandle);
		if (!blockee) {
			res.status(404).send("User not found");
			return;
		}
		const blocked = await session.withTransaction(async () => {
			const blockeeUserId = blockee._id;
			const blockedUser = await new Block({
				user: blockeeUserId,
				blockedBy: blockerUserId,
				reason: blockReason
			}).save({ session });
			await Promise.all([
				FollowRequest.deleteOne({
					user: blockeeUserId,
					requestedBy: blockerUserId
				}).session(session),
				FollowRequest.deleteOne({
					user: blockerUserId,
					requestedBy: blockeeUserId
				}).session(session),
				Follow.deleteOne({
					user: blockeeUserId,
					followedBy: blockerUserId
				}).session(session),
				Follow.deleteOne({
					user: blockerUserId,
					followedBy: blockeeUserId
				}).session(session),
				ListMember.deleteMany({
					list: await List.find({ owner: blockerUserId }, { _id: 1 }),
					user: blockeeUserId
				}).session(session),
				ListMember.deleteMany({
					list: await List.find({ owner: blockeeUserId }, { _id: 1 }),
					user: blockerUserId
				}).session(session),
				User.findByIdAndUpdate(blockerUserId, {
					$pull: {
						follows: blockeeUserId
					},
					$addToSet: {
						blockedUsers: blockeeUserId
					}
				}).session(session),
				List.updateMany(
					{ owner: blockerUserId },
					{
						$pull: {
							members: blockeeUserId
						}
					}
				).session(session),
				List.updateMany(
					{ owner: blockeeUserId },
					{
						$pull: {
							members: blockerUserId
						}
					}
				).session(session)
			]);
			return blockedUser;
		});
		res.status(200).json({ blocked });
	} finally {
		await session.endSession();
	}
};
export const unblockUser: RequestHandler = async (req, res, next) => {
	const unblockeeHandle = req.params.handle;
	const { handle: unblockerHandle, userId: unblockerUserId } = req.userInfo as UserInfo;
	if (unblockeeHandle === unblockerHandle) {
		res.status(422).send("User cannot unblock themselves");
		return;
	}
	const unblockee = await usersController.findUserByHandle(unblockeeHandle);
	if (!unblockee) {
		res.status(404).send("User not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		const unblocked = await session.withTransaction(async () => {
			const unblockeeUserId = unblockee._id;
			const unblockedUser = await Block.findOneAndDelete({ user: unblockeeUserId, blockedBy: unblockerUserId }).session(session);
			if (unblockedUser) {
				await User.findByIdAndUpdate(unblockerUserId, {
					$pull: {
						blockedUsers: unblockeeUserId
					}
				}).session(session);
			}
			return unblockedUser;
		});
		res.status(200).json({ unblocked });
	} finally {
		await session.endSession();
	}
};