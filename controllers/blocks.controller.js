"use strict";

const generalController = require("./general.controller");
const usersController = require("./users.controller");
const Follow = require("../models/follow.model");
const Block = require("../models/block.model");

const blockUser = async (req, res, next) => {
	const blockUserAction = "Block user";
	const blockeeHandle = req.params.handle;
	const blockerHandle = req.userInfo.handle;
	const blockerUserId = req.userInfo.userId;
	if (blockeeHandle === blockerHandle) {
		generalController.failureResponse(res, 422, followUserAction, "User cannot block themselves");
		return;
	}
	try {
		const blockee = await usersController.findActiveUserByHandle(blockeeHandle);
		if (!blockee) {
			generalController.failureResponse(res, 404, blockUserAction, "User not found");
			return;
		}
		const blockeeUserId = blockee._id;
		await Follow.findOneAndDelete({ user: blockeeUserId, followedBy: blockerUserId });
		const blocked = await new Block({ user: blockeeUserId, blockedBy: blockerUserId }).save();
		generalController.successResponse(res, 200, blockUserAction, { blocked });
	} catch (err) {
		generalController.failureResponse(res, 500, blockUserAction, err.message);
	}
};
const unblockUser = async (req, res, next) => {
	const unblockUserAction = "Unblock user";
	const unblockeeHandle = req.params.handle;
	const unblockerHandle = req.userInfo.handle;
	const unblockerUserId = req.userInfo.userId;
	if (unblockeeHandle === unblockerHandle) {
		generalController.failureResponse(res, 422, unblockUserAction, "User cannot unblock themselves");
		return;
	}
	try {
		const unblockee = await usersController.findUserByHandle(unblockeeHandle);
		if (!unblockee) {
			generalController.failureResponse(res, 404, unblockUserAction, "User not found");
			return;
		}
		const unblocked = await Block.findOneAndDelete({ user: unblockee._id, blockedBy: unblockerUserId });
		generalController.successResponse(res, 200, unblockUserAction, { unblocked });
	} catch (err) {
		generalController.failureResponse(res, 500, unblockUserAction, err.message);
	}
};

module.exports = { blockUser, unblockUser };