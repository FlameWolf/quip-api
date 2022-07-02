"use strict";

const postsController = require("./posts.controller");
const Bookmark = require("../models/bookmark.model");

const addBookmark = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const bookmarked = await new Bookmark({
		post: post._id,
		bookmarkedBy: userId
	}).save();
	res.status(200).json({ bookmarked });
};
const removeBookmark = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const unbookmarked = await Bookmark.findOneAndDelete({
		post: postId,
		bookmarkedBy: userId
	});
	res.status(200).json({ unbookmarked });
};

module.exports = { addBookmark, removeBookmark };