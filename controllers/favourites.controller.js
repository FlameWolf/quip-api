"use strict";

const Post = require("../models/post.model");
const Favourite = require("../models/favourite.model");

const addFavourite = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		if (!(await Post.countDocuments({ _id: postId }))) {
			res.status(404).send("Post not found");
			return;
		}
		const favourited = await new Favourite({
			post: postId,
			favouritedBy: userId
		}).save();
		res.status(200).json({ favourited });
	} catch (err) {
		next(err);
	}
};
const removeFavourite = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unfavourited = await Favourite.findOneAndDelete({
			post: postId,
			favouritedBy: userId
		});
		res.status(200).json({ unfavourited });
	} catch (err) {
		next(err);
	}
};

module.exports = { addFavourite, removeFavourite };