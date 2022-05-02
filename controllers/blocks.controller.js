"use strict";

const usersController = require("./users.controller");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");
const Block = require("../models/block.model");

const blockUser = async (req, res, next) => {
	const blockeeHandle = req.params.handle;
	const blockerHandle = req.userInfo.handle;
	const blockerUserId = req.userInfo.userId;
	if (blockeeHandle === blockerHandle) {
		res.status(422).send("User cannot block themselves");
		return;
	}
	try {
		const blockee = await usersController.findActiveUserByHandle(blockeeHandle);
		if (!blockee) {
			res.status(404).send("User not found");
			return;
		}
		const blockeeUserId = blockee._id;
		const blocked = await new Block({ user: blockeeUserId, blockedBy: blockerUserId }).save();
		res.status(200).json({ blocked });
		FollowRequest.deleteOne({ user: blockeeUserId, requestedBy: blockerUserId }).exec();
		FollowRequest.deleteOne({ user: blockerUserId, requestedBy: blockeeUserId }).exec();
		Follow.deleteOne({ user: blockeeUserId, followedBy: blockerUserId }).exec();
		Follow.deleteOne({ user: blockerUserId, followedBy: blockeeUserId }).exec();
	} catch (err) {
		next(err);
	}
};
const unblockUser = async (req, res, next) => {
	const unblockeeHandle = req.params.handle;
	const unblockerHandle = req.userInfo.handle;
	const unblockerUserId = req.userInfo.userId;
	if (unblockeeHandle === unblockerHandle) {
		res.status(422).send("User cannot unblock themselves");
		return;
	}
	try {
		const unblockee = await usersController.findUserByHandle(unblockeeHandle);
		if (!unblockee) {
			res.status(404).send("User not found");
			return;
		}
		const unblocked = await Block.findOneAndDelete({ user: unblockee._id, blockedBy: unblockerUserId });
		res.status(200).json({ unblocked });
	} catch (err) {
		next(err);
	}
};

module.exports = { blockUser, unblockUser };