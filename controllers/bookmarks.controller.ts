"use strict";

import * as postsController from "./posts.controller";
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
	const bookmarked = await new Bookmark({
		post: postId,
		bookmarkedBy: userId
	});
	res.status(200).json({ bookmarked });
};
export const removeBookmark: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const unbookmarked = await Bookmark.findOneAndDelete({
		post: postId,
		bookmarkedBy: userId
	});
	res.status(200).json({ unbookmarked });
};