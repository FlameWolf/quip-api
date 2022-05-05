"use strict";

const Post = require("../models/post.model");
const Bookmark = require("../models/bookmark.model");

const addBookmark = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		if (!(await Post.countDocuments({ _id: postId }))) {
			res.status(404).send("Post not found");
			return;
		}
		const bookmarked = await new Bookmark({
			post: postId,
			bookmarkedBy: userId
		}).save();
		res.status(200).json({ bookmarked });
	} catch (err) {
		next(err);
	}
};
const removeBookmark = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unbookmarked = await Bookmark.findOneAndDelete({
			post: postId,
			bookmarkedBy: userId
		});
		res.status(200).json({ unbookmarked });
	} catch (err) {
		next(err);
	}
};

module.exports = { addBookmark, removeBookmark };