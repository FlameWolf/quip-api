"use strict";

import mongoose from "mongoose";
import User from "../models/user.model.ts";
import MutedUser from "../models/muted.user.model.ts";
import MutedPost from "../models/muted.post.model.ts";
import MutedWord from "../models/muted.word.model.ts";
import * as usersController from "./users.controller.ts";
import * as postsController from "./posts.controller.ts";
import type { RequestHandler } from "express";

const getMutedWordRegExp = (word: string, match: string) => {
	switch (match) {
		case "startsWith":
			return `\\b${word}.*?\\b`;
		case "endsWith":
			return `\\b\\w*?${word}\\b`;
		case "exact":
			return `\\b${word}\\b`;
		default:
			return word;
	}
};
export const muteUser: RequestHandler = async (req, res, next) => {
	const muteeHandle = req.params.handle;
	const muteReason = req.query.reason;
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
	const session = await mongoose.startSession();
	try {
		const muted = await session.withTransaction(async () => {
			const muteeUserId = mutee._id;
			const mutedUser = await new MutedUser({
				user: muteeUserId,
				mutedBy: muterUserId,
				reason: muteReason
			}).save({ session });
			await User.findByIdAndUpdate(muterUserId, {
				$addToSet: {
					mutedUsers: muteeUserId
				}
			}).session(session);
			return mutedUser;
		});
		res.status(200).json({ muted });
	} finally {
		await session.endSession();
	}
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
	const session = await mongoose.startSession();
	try {
		const unmuted = await session.withTransaction(async () => {
			const unmuteeUserId = unmutee._id;
			const unmutedUser = await MutedUser.findOneAndDelete({ user: unmuteeUserId, mutedBy: unmuterUserId }).session(session);
			if (unmutedUser) {
				await User.findByIdAndUpdate(unmuterUserId, {
					$pull: {
						mutedUsers: unmuteeUserId
					}
				}).session(session);
			}
			return unmutedUser;
		});
		res.status(200).json({ unmuted });
	} finally {
		await session.endSession();
	}
};
export const mutePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		const muted = await session.withTransaction(async () => {
			const mutedPost = await new MutedPost({ post: postId, mutedBy: userId }).save({ session });
			await User.findByIdAndUpdate(userId, {
				$addToSet: {
					mutedPosts: postId
				}
			}).session(session);
			return mutedPost;
		});
		res.status(200).json({ muted });
	} finally {
		await session.endSession();
	}
};
export const unmutePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const unmuted = await session.withTransaction(async () => {
			const unmutedPost = await MutedPost.findOneAndDelete({ post: postId, mutedBy: userId }).session(session);
			if (unmutedPost) {
				await User.findByIdAndUpdate(userId, {
					$pull: {
						mutedPosts: postId
					}
				}).session(session);
			}
			return unmutedPost;
		});
		res.status(200).json({ unmuted });
	} finally {
		await session.endSession();
	}
};
export const muteWord: RequestHandler = async (req, res, next) => {
	const { word, match } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const muted = await session.withTransaction(async () => {
			const mutedWord = await new MutedWord({ word, match, mutedBy: userId }).save({ session });
			await User.findByIdAndUpdate(userId, {
				$addToSet: {
					mutedWords: getMutedWordRegExp(word, match)
				}
			}).session(session);
			return mutedWord;
		});
		res.status(200).json({ muted });
	} finally {
		await session.endSession();
	}
};
export const unmuteWord: RequestHandler = async (req, res, next) => {
	const { word, match } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const unmuted = await session.withTransaction(async () => {
			const unmutedWord = await MutedWord.findOneAndDelete({ word, match, mutedBy: userId }).session(session);
			if (unmutedWord) {
				await User.findByIdAndUpdate(userId, {
					$pull: {
						mutedWords: getMutedWordRegExp(word, match)
					}
				}).session(session);
			}
			return unmutedWord;
		});
		res.status(200).json({ unmuted });
	} finally {
		await session.endSession();
	}
};