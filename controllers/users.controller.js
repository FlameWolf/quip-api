"use strict";

const generalController = require("./general.controller");
const User = require("../models/user.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, isDeactivated: false, isDeleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, isDeactivated: false, isDeleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, isDeleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, isDeleted: false });
const getUser = async (req, res, next) => {
	const getUserProfileAction = "Get user profile";
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle).select("+posts");
		if (!user) {
			generalController.failureResponse(res, 404, getUserProfileAction, "User not found");
			return;
		}
		generalController.successResponse(res, 200, getUserProfileAction, { user });
	} catch (err) {
		generalController.failureResponse(res, 500, getUserProfileAction, err.message);
	}
};
const getUserProfile = async (req, res, next) => {
	const getUserProfileAction = "Get user profile";
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle).select("+posts");
		if (!user) {
			generalController.failureResponse(res, 404, getUserProfileAction, "User not found");
			return;
		}
		generalController.successResponse(res, 200, getUserProfileAction, { user });
	} catch (err) {
		generalController.failureResponse(res, 500, getUserProfileAction, err.message);
	}
};
const muteUser = async (req, res, next) => {
	const muteUserAction = "Mute user";
	const muteeHandle = req.params.handle;
	const muterHandle = req.userInfo.handle;
	const muterUserId = req.userInfo.userId;
	if (muteeHandle === muterHandle) {
		generalController.failureResponse(res, 422, followUserAction, "User cannot mute themselves");
		return;
	}
	try {
		const mutee = await findActiveUserByHandle(muteeHandle);
		if (!mutee) {
			generalController.failureResponse(res, 404, muteUserAction, "User not found");
			return;
		}
		const muter = await User.findByIdAndUpdate(muterUserId, { $addToSet: { "muteList.users": mutee._id } });
		generalController.successResponse(res, 200, muteUserAction, { muted: mutee, mutedBy: muter });
	} catch (err) {
		generalController.failureResponse(res, 500, muteUserAction, err.message);
	}
};
const unmuteUser = async (req, res, next) => {
	const unmuteUserAction = "Unmute user";
	const unmuteeHandle = req.params.handle;
	const unmuterHandle = req.userInfo.handle;
	const unmuterUserId = req.userInfo.userId;
	if (unmuteeHandle === unmuterHandle) {
		generalController.failureResponse(res, 422, followUserAction, "User cannot unmute themselves");
		return;
	}
	try {
		const umnutee = await findActiveUserByHandle(unmuteeHandle);
		if (!umnutee) {
			generalController.failureResponse(res, 404, unmuteUserAction, "User not found");
			return;
		}
		const unmuter = await User.findByIdAndUpdate(unmuterUserId, { $pull: { "muteList.users": umnutee._id } });
		generalController.successResponse(res, 200, unmuteUserAction, { unmuted: umnutee, unmutedBy: unmuter });
	} catch (err) {
		generalController.failureResponse(res, 500, unmuteUserAction, err.message);
	}
};
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
		const blockee = await findActiveUserByHandle(blockeeHandle);
		if (!blockee) {
			generalController.failureResponse(res, 404, blockUserAction, "User not found");
			return;
		}
		const blockeeId = blockee._id;
		await User.findByIdAndUpdate(blockerUserId, { $pull: { following: blockeeId } });
		await User.updateOne(blockee, { $pull: { following: blockerUserId } });
		const blocker = await User.findByIdAndUpdate(blockerUserId, { $addToSet: { blockList: blockeeId } });
		generalController.successResponse(res, 200, blockUserAction, { blocked: blockee, blockedBy: blocker });
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
		generalController.failureResponse(res, 422, followUserAction, "User cannot unblock themselves");
		return;
	}
	try {
		const unblockee = await findActiveUserByHandle(unblockeeHandle);
		if (!unblockee) {
			generalController.failureResponse(res, 404, unblockUserAction, "User not found");
			return;
		}
		const unblocker = await User.findByIdAndUpdate(unblockerUserId, { $pull: { blockList: unblockee._id } });
		generalController.successResponse(res, 200, unblockUserAction, { unblocked: unblockee, unblockedBy: unblocker });
	} catch (err) {
		generalController.failureResponse(res, 500, unblockUserAction, err.message);
	}
};

module.exports = {
	findActiveUserById,
	findActiveUserByHandle,
	findUserById,
	findUserByHandle,
	getUser,
	getUserProfile,
	muteUser,
	unmuteUser,
	blockUser,
	unblockUser
};