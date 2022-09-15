"use strict";

import mongoose from "mongoose";
import * as postsController from "./posts.controller";
import User from "../models/user.model";
import Bookmark from "../models/bookmark.model";
import { RequestHandler } from "express";

export const addBookmark: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const session = await mongoose.startSession();
	try {
		const bookmarked = await new Bookmark({
			post: postId,
			bookmarkedBy: userId
		}).save({ session });
		User.findByIdAndUpdate(userId, {
			$addToSet: {
				bookmarks: postId
			}
		}).session(session);
		res.status(200).json({ bookmarked });
	} finally {
		await session.endSession();
	}
};
export const removeBookmark: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const unbookmarked = await Bookmark.findOneAndDelete({
			post: postId,
			bookmarkedBy: userId
		}).session(session);
		if (unbookmarked) {
			User.findByIdAndUpdate(userId, {
				$pull: {
					bookmarks: postId
				}
			}).session(session);
		}
		res.status(200).json({ unbookmarked });
	} finally {
		await session.endSession();
	}
};