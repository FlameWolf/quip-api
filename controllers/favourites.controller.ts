"use strict";

import mongoose from "mongoose";
import { favouriteScore } from "../library";
import * as postsController from "./posts.controller";
import Post from "../models/post.model";
import Favourite from "../models/favourite.model";
import { RequestHandler } from "express";

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
		await session.withTransaction(async () => {
			const originalPostId = post._id;
			const favourited = await new Favourite({
				post: originalPostId,
				favouritedBy: userId
			}).save({ session });
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: favouriteScore
				}
			}).session(session);
			res.status(200).json({ favourited });
		});
	} finally {
		await session.endSession();
	}
};
export const removeFavourite: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unfavourited = await Favourite.findOneAndDelete({
				post: postId,
				favouritedBy: userId
			}).session(session);
			if (unfavourited) {
				await Post.findByIdAndUpdate(postId, {
					$inc: {
						score: -favouriteScore
					}
				}).session(session);
			}
			res.status(200).json({ unfavourited });
		});
	} finally {
		await session.endSession();
	}
};