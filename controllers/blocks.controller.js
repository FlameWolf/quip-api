"use strict";

const mongoose = require("mongoose");
const usersController = require("./users.controller");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");
const List = require("../models/list.model");
const ListMember = require("../models/list-member.model");
const Block = require("../models/block.model");

const blockUser = async (req, res, next) => {
	const blockeeHandle = req.params.handle;
	const blockReason = req.query.reason;
	const { handle: blockerHandle, userId: blockerUserId } = req.userInfo;
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
		await session.withTransaction(async () => {
			const blockeeUserId = blockee._id;
			const blocked = await new Block({
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
				}).session(session)
			]);
			res.status(200).json({ blocked });
		});
	} finally {
		await session.endSession();
	}
};
const unblockUser = async (req, res, next) => {
	const unblockeeHandle = req.params.handle;
	const { handle: unblockerHandle, userId: unblockerUserId } = req.userInfo;
	if (unblockeeHandle === unblockerHandle) {
		res.status(422).send("User cannot unblock themselves");
		return;
	}
	const unblockee = await usersController.findUserByHandle(unblockeeHandle);
	if (!unblockee) {
		res.status(404).send("User not found");
		return;
	}
	const unblocked = await Block.findOneAndDelete({ user: unblockee._id, blockedBy: unblockerUserId });
	res.status(200).json({ unblocked });
};

module.exports = { blockUser, unblockUser };