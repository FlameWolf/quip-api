"use strict";

const mongoose = require("mongoose");
const { favouriteScore } = require("../library");
const Post = require("../models/post.model");
const Favourite = require("../models/favourite.model");

const addFavourite = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		if (!(await Post.countDocuments({ _id: postId }))) {
			res.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const favourited = await new Favourite({
				post: postId,
				favouritedBy: userId
			}).save({ session });
			await Post.findByIdAndUpdate(postId, {
				$inc: {
					score: favouriteScore
				}
			}).session(session);
			res.status(200).json({ favourited });
		});
	} catch (err) {
		next(err);
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
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};

module.exports = { addFavourite, removeFavourite };