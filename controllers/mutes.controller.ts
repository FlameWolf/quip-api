"use strict";

import * as usersController from "./users.controller";
import * as postsController from "./posts.controller";
import MutedUser from "../models/muted.user.model";
import MutedPost from "../models/muted.post.model";
import MutedWord from "../models/muted.word.model";
import { RequestHandler } from "express";

export const muteUser: RequestHandler = async (req, res, next) => {
	const muteeHandle = req.params.handle;
	const { handle: muterHandle, userId: muterUserId } = req.userInfo as UserInfo;
	if (muteeHandle === muterHandle) {
		res.status(422).send("User cannot mute themselves");
		return;
	}
	const mutee = await usersController.findActiveUserByHandle(muteeHandle);
	if (!mutee) {
		res.status(404).send("User not found");
		return;
	}
	const muted = await new MutedUser({ user: mutee._id, mutedBy: muterUserId }).save();
	res.status(200).json({ muted });
};
export const unmuteUser: RequestHandler = async (req, res, next) => {
	const unmuteeHandle = req.params.handle;
	const { handle: unmuterHandle, userId: unmuterUserId } = req.userInfo as UserInfo;
	if (unmuteeHandle === unmuterHandle) {
		res.status(422).send("User cannot unmute themselves");
		return;
	}
	const unmutee = await usersController.findUserByHandle(unmuteeHandle);
	if (!unmutee) {
		res.status(404).send("User not found");
		return;
	}
	const unmuted = await MutedUser.findOneAndDelete({ user: unmutee._id, mutedBy: unmuterUserId });
	res.status(200).json({ unmuted });
};
export const mutePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const muted = await new MutedPost({ post: post._id, mutedBy: userId }).save();
	res.status(200).json({ muted });
};
export const unmutePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const unmuted = await MutedPost.findOneAndDelete({ post: postId, mutedBy: userId });
	res.status(200).json({ unmuted });
};
export const muteWord: RequestHandler = async (req, res, next) => {
	const { word, match } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
	const muted = await new MutedWord({ word, match, mutedBy: userId }).save();
	res.status(200).json({ muted });
};
export const unmuteWord: RequestHandler = async (req, res, next) => {
	const { word, match } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
	const unmuted = await MutedWord.findOneAndDelete({ word, match, mutedBy: userId });
	res.status(200).json({ unmuted });
};