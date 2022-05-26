"use strict";

const usersController = require("./users.controller");
const postsController = require("./posts.controller");
const MutedUser = require("../models/muted.user.model");
const MutedPost = require("../models/muted.post.model");
const MutedWord = require("../models/muted.word.model");

const muteUser = async (req, res, next) => {
	const muteeHandle = req.params.handle;
	const muterHandle = req.userInfo.handle;
	const muterUserId = req.userInfo.userId;
	if (muteeHandle === muterHandle) {
		res.status(422).send("User cannot mute themselves");
		return;
	}
	try {
		const mutee = await usersController.findActiveUserByHandle(muteeHandle);
		if (!mutee) {
			res.status(404).send("User not found");
			return;
		}
		const muted = await new MutedUser({ user: mutee._id, mutedBy: muterUserId }).save();
		res.status(200).json({ muted });
	} catch (err) {
		next(err);
	}
};
const unmuteUser = async (req, res, next) => {
	const unmuteeHandle = req.params.handle;
	const unmuterHandle = req.userInfo.handle;
	const unmuterUserId = req.userInfo.userId;
	if (unmuteeHandle === unmuterHandle) {
		res.status(422).send("User cannot unmute themselves");
		return;
	}
	try {
		const unmutee = await usersController.findUserByHandle(unmuteeHandle);
		if (!unmutee) {
			res.status(404).send("User not found");
			return;
		}
		const unmuted = await MutedUser.findOneAndDelete({ user: unmutee._id, mutedBy: unmuterUserId });
		res.status(200).json({ unmuted });
	} catch (err) {
		next(err);
	}
};
const mutePost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const post = await postsController.findPostById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		const muted = await new MutedPost({ post: post._id, mutedBy: userId }).save();
		res.status(200).json({ muted });
	} catch (err) {
		next(err);
	}
};
const unmutePost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unmuted = await MutedPost.findOneAndDelete({ post: postId, mutedBy: userId });
		res.status(200).json({ unmuted });
	} catch (err) {
		next(err);
	}
};
const muteWord = async (req, res, next) => {
	const { word, match } = req.body;
	const userId = req.userInfo.userId;
	try {
		const muted = await new MutedWord({ word, match, mutedBy: userId }).save();
		res.status(200).json({ muted });
	} catch (err) {
		next(err);
	}
};
const unmuteWord = async (req, res, next) => {
	const { word, match } = req.body;
	const userId = req.userInfo.userId;
	try {
		const unmuted = await MutedWord.findOneAndDelete({ word, match, mutedBy: userId });
		res.status(200).json({ unmuted });
	} catch (err) {
		next(err);
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