"use strict";

const mongoose = require("mongoose");
const { favouriteScore } = require("../library");
const postsController = require("./posts.controller");
const Post = require("../models/post.model");
const Favourite = require("../models/favourite.model");

const addFavourite = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
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
const removeFavourite = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
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

module.exports = { addFavourite, removeFavourite };