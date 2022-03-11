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
		generalController.failureResponse(res, 422, muteUserAction, "User cannot mute themselves");
		return;
	}
	try {
		const mutee = await usersController.findActiveUserByHandle(muteeHandle);
		if (!mutee) {
			generalController.failureResponse(res, 404, muteUserAction, "User not found");
			return;
		}
		const muteResult = await new MutedUser({ user: mutee._id, mutedBy: muterUserId }).save();
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
		const unmuteResult = await MutedUser.findOneAndDelete({ user: unmutee._id, mutedBy: unmuterUserId });
		generalController.successResponse(res, 200, unmuteUserAction, unmuteResult);
	} catch (err) {
		generalController.failureResponse(res, 500, unmuteUserAction, err.message);
	}
};
const mutePost = async (req, res, next) => {
	const mutePostAction = "Mute post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const muteResult = await new MutedPost({ post: postId, mutedBy: userId }).save();
		generalController.successResponse(res, 200, mutePostAction, muteResult);
	} catch (err) {
		generalController.failureResponse(res, 500, mutePostAction, err.message);
	}
};
const unmutePost = async (req, res, next) => {
	const unmutePostAction = "Unmute post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const muteResult = await MutedPost.findOneAndDelete({ post: postId, mutedBy: userId });
		generalController.successResponse(res, 200, unmutePostAction, muteResult);
	} catch (err) {
		generalController.failureResponse(res, 500, unmutePostAction, err.message);
	}
};
const muteWord = async (req, res, next) => {
	const muteWordAction = "Mute word";
	const word = req.body.word;
	const match = req.body.match;
	const userId = req.userInfo.userId;
	try {
		const muteResult = await new MutedWord({ word, match, mutedBy: userId }).save();
		generalController.successResponse(res, 200, muteWordAction, muteResult);
	} catch (err) {
		generalController.failureResponse(res, 500, muteWordAction, err.message);
	}
};
const unmuteWord = async (req, res, next) => {
	const unmuteWordAction = "Unmute word";
	const word = req.body.word;
	const match = req.body.match;
	const userId = req.userInfo.userId;
	try {
		const unmuteResult = await MutedWord.findOneAndDelete({ word, match, mutedBy: userId });
		generalController.successResponse(res, 200, unmuteWordAction, unmuteResult);
	} catch (err) {
		generalController.failureResponse(res, 500, unmuteWordAction, err.message);
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