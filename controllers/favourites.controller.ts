"use strict";

import mongoose from "mongoose";
import { favouriteScore } from "../library.ts";
import Post from "../models/post.model.ts";
import Favourite from "../models/favourite.model.ts";
import * as postsController from "./posts.controller.ts";
import type { RequestHandler } from "express";

export const addFavourite: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const post = await postsController.findPostById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		const favourited = await session.withTransaction(async () => {
			const originalPostId = post._id;
			const favouritedPost = await new Favourite({
				post: originalPostId,
				favouritedBy: userId
			}).save({ session });
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: favouriteScore
				}
			}).session(session);
			return favouritedPost;
		});
		res.status(200).json({ favourited });
	} finally {
		await session.endSession();
	}
};
export const removeFavourite: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const unfavourited = await session.withTransaction(async () => {
			const unfavouritedPost = await Favourite.findOneAndDelete({
				post: postId,
				favouritedBy: userId
			}).session(session);
			if (unfavouritedPost) {
				await Post.findByIdAndUpdate(postId, {
					$inc: {
						score: -favouriteScore
					}
				}).session(session);
			}
			return unfavouritedPost;
		});
		res.status(200).json({ unfavourited });
	} finally {
		await session.endSession();
	}
};