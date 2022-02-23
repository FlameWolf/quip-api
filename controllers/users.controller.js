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
	blockUser,
	unblockUser
};