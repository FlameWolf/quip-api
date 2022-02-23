"use strict";

const generalController = require("./general.controller");
const usersController = require("./users.controller");
const MuteUser = require("../models/mute.user.model");
const MutePost = require("../models/mute.post.model");
const MuteWord = require("../models/mute.word.model");

const muteUser = async (req, res, next) => {
	const muteUserAction = "Mute user";
	const muteeHandle = req.params.handle;
	const muterHandle = req.userInfo.handle;
	const muterUserId = req.userInfo.userId;
	if (muteeHandle === muterHandle) {
		generalController.failureResponse(res, 422, muteUserAction, "User cannot mute themselves");
		return;
	}
	try {
		const mutee = await usersController.findActiveUserByHandle(muteeHandle);
		if (!mutee) {
			generalController.failureResponse(res, 404, muteUserAction, "User not found");
			return;
		}
		const muteResult = await new MuteUser({ user: mutee._id, mutedBy: muterUserId }).save();
		generalController.successResponse(res, 200, muteUserAction, muteResult);
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
		generalController.failureResponse(res, 422, unmuteUserAction, "User cannot unmute themselves");
		return;
	}
	try {
		const unmutee = await usersController.findUserByHandle(unmuteeHandle);
		if (!unmutee) {
			generalController.failureResponse(res, 404, unmuteUserAction, "User not found");
			return;
		}
		const unmuteResult = await MuteUser.findOneAndDelete({ user: unmutee._id, mutedBy: unmuterUserId });
		generalController.successResponse(res, 200, unmuteUserAction, unmuteResult);
	} catch (err) {
		generalController.failureResponse(res, 500, unmuteUserAction, err.message);
	}
};
const mutePost = async (req, res, next) => {};
const unmutePost = async (req, res, next) => {};
const muteWord = async (req, res, next) => {};
const unmuteWord = async (req, res, next) => {};

module.exports = {
	muteUser,
	mutePost,
	muteWord,
	unmuteUser,
	unmutePost,
	unmuteWord
};