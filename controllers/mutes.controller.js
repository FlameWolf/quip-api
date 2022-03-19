"use strict";

const generalController = require("./general.controller");
const usersController = require("./users.controller");
const MutedUser = require("../models/muted.user.model");
const MutedPost = require("../models/muted.post.model");
const MutedWord = require("../models/muted.word.model");

const muteUser = async (req, res, next) => {
	const muteUserAction = "Mute user";
	const muteeHandle = req.params.handle;
	const muterHandle = req.userInfo.handle;
	const muterUserId = req.userInfo.userId;
	if (muteeHandle === muterHandle) {
		generalController.sendResponse(res, 422, muteUserAction, "User cannot mute themselves");
		return;
	}
	try {
		const mutee = await usersController.findActiveUserByHandle(muteeHandle);
		if (!mutee) {
			generalController.sendResponse(res, 404, muteUserAction, "User not found");
			return;
		}
		const muted = await new MutedUser({ user: mutee._id, mutedBy: muterUserId }).save();
		generalController.sendResponse(res, 200, muteUserAction, { muted });
	} catch (err) {
		generalController.sendResponse(res, 500, muteUserAction, err);
	}
};
const unmuteUser = async (req, res, next) => {
	const unmuteUserAction = "Unmute user";
	const unmuteeHandle = req.params.handle;
	const unmuterHandle = req.userInfo.handle;
	const unmuterUserId = req.userInfo.userId;
	if (unmuteeHandle === unmuterHandle) {
		generalController.sendResponse(res, 422, unmuteUserAction, "User cannot unmute themselves");
		return;
	}
	try {
		const unmutee = await usersController.findUserByHandle(unmuteeHandle);
		if (!unmutee) {
			generalController.sendResponse(res, 404, unmuteUserAction, "User not found");
			return;
		}
		const unmuted = await MutedUser.findOneAndDelete({ user: unmutee._id, mutedBy: unmuterUserId });
		generalController.sendResponse(res, 200, unmuteUserAction, { unmuted });
	} catch (err) {
		generalController.sendResponse(res, 500, unmuteUserAction, err);
	}
};
const mutePost = async (req, res, next) => {
	const mutePostAction = "Mute post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const muted = await new MutedPost({ post: postId, mutedBy: userId }).save();
		generalController.sendResponse(res, 200, mutePostAction, { muted });
	} catch (err) {
		generalController.sendResponse(res, 500, mutePostAction, err);
	}
};
const unmutePost = async (req, res, next) => {
	const unmutePostAction = "Unmute post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unmuted = await MutedPost.findOneAndDelete({ post: postId, mutedBy: userId });
		generalController.sendResponse(res, 200, unmutePostAction, { unmuted });
	} catch (err) {
		generalController.sendResponse(res, 500, unmutePostAction, err);
	}
};
const muteWord = async (req, res, next) => {
	const muteWordAction = "Mute word";
	const { word, match } = req.body;
	const userId = req.userInfo.userId;
	try {
		const muted = await new MutedWord({ word, match, mutedBy: userId }).save();
		generalController.sendResponse(res, 200, muteWordAction, { muted });
	} catch (err) {
		generalController.sendResponse(res, 500, muteWordAction, err);
	}
};
const unmuteWord = async (req, res, next) => {
	const unmuteWordAction = "Unmute word";
	const { word, match } = req.body;
	const userId = req.userInfo.userId;
	try {
		const unmuted = await MutedWord.findOneAndDelete({ word, match, mutedBy: userId });
		generalController.sendResponse(res, 200, unmuteWordAction, { unmuted });
	} catch (err) {
		generalController.sendResponse(res, 500, unmuteWordAction, err);
	}
};

module.exports = {
	muteUser,
	unmuteUser,
	mutePost,
	unmutePost,
	muteWord,
	unmuteWord
};