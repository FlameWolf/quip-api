"use strict";

const generalController = require("./general.controller");
const usersController = require("./users.controller");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");
const Block = require("../models/block.model");

const blockUser = async (req, res, next) => {
	const blockUserAction = "Block user";
	const blockeeHandle = req.params.handle;
	const blockerHandle = req.userInfo.handle;
	const blockerUserId = req.userInfo.userId;
	if (blockeeHandle === blockerHandle) {
		generalController.sendResponse(res, 422, followUserAction, "User cannot block themselves");
		return;
	}
	try {
		const blockee = await usersController.findActiveUserByHandle(blockeeHandle);
		if (!blockee) {
			generalController.sendResponse(res, 404, blockUserAction, "User not found");
			return;
		}
		const blockeeUserId = blockee._id;
		await FollowRequest.deleteOne({ user: blockeeUserId, requestedBy: blockerUserId });
		await FollowRequest.deleteOne({ user: blockerUserId, requestedBy: blockeeUserId });
		await Follow.deleteOne({ user: blockeeUserId, followedBy: blockerUserId });
		await Follow.deleteOne({ user: blockerUserId, followedBy: blockeeUserId });
		const blocked = await new Block({ user: blockeeUserId, blockedBy: blockerUserId }).save();
		generalController.sendResponse(res, 200, blockUserAction, { blocked });
	} catch (err) {
		generalController.sendResponse(res, 500, blockUserAction, err);
	}
};
const unblockUser = async (req, res, next) => {
	const unblockUserAction = "Unblock user";
	const unblockeeHandle = req.params.handle;
	const unblockerHandle = req.userInfo.handle;
	const unblockerUserId = req.userInfo.userId;
	if (unblockeeHandle === unblockerHandle) {
		generalController.sendResponse(res, 422, unblockUserAction, "User cannot unblock themselves");
		return;
	}
	try {
		const unblockee = await usersController.findUserByHandle(unblockeeHandle);
		if (!unblockee) {
			generalController.sendResponse(res, 404, unblockUserAction, "User not found");
			return;
		}
		const unblocked = await Block.findOneAndDelete({ user: unblockee._id, blockedBy: unblockerUserId });
		generalController.sendResponse(res, 200, unblockUserAction, { unblocked });
	} catch (err) {
		generalController.sendResponse(res, 500, unblockUserAction, err);
	}
};

module.exports = { blockUser, unblockUser };