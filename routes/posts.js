"use strict";

const express = require("express");
const router = express.Router();
const generalController = require("../controllers/general.controller");
const Post = require("../models/post.model");

router.post("/create", async (req, res, next) => {
	const createPostAction = "Create post";
	const content = req.body.content;
	const author = req.body.userId;
	const repeatPost = req.body.repeatPost;
	const replyTo = req.body.replyTo;
	if (!(content || repeatPost)) {
		generalController.failureResponse(res, 400, createPostAction, "No content");
		return;
	}
	const model = new Post({ content, author, repeatPost, replyTo });
	try {
		const post = await model.save();
		generalController.successResponse(res, 201, createPostAction, post);
	} catch (err) {
		generalController.failureResponse(res, 500, createPostAction, err.message);
	}
});
router.post("/favourite", async (req, res, next) => {
	const favouritePostAction = "Add favourite";
	const postId = req.body.postId;
	const userId = req.body.userId;
	try {
		const result = await Post.findByIdAndUpdate(postId, { $addToSet: { favouritedBy: userId } });
		generalController.successResponse(res, 200, favouritePostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, favouritePostAction, err.message);
	}
});
router.post("/unfavourite", async (req, res, next) => {
	const unfavouritePostAction = "Remove favourite";
	const postId = req.body.postId;
	const userId = req.body.userId;
	try {
		const result = await Post.findByIdAndUpdate(postId, { $pull: { favouritedBy: userId } });
		generalController.successResponse(res, 200, unfavouritePostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, unfavouritePostAction, err.message);
	}
});
router.post("/repeat", async (req, res, next) => {
	const repeatPostAction = "Repeat";
	const postId = req.body.postId;
	const userId = req.body.userId;
	const payload = {
		author: userId,
		repeatPost: postId
	};
	try {
		if (await Post.find(payload)) {
			await Post.deleteOne(payload);
		}
		const post = await new Post(payload).save();
		generalController.successResponse(res, 201, repeatPostAction, post);
	} catch (err) {
		generalController.failureResponse(res, 500, repeatPostAction, err.message);
	}
});
router.post("/unrepeat", async (req, res, next) => {
	const unrepeatPostAction = "Undo repeat";
	const postId = req.body.postId;
	const userId = req.body.userId;
	try {
		const result = await Post.deleteOne({
			author: userId,
			repeatPost: postId
		});
		generalController.successResponse(res, 201, unrepeatPostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, unrepeatPostAction, err.message);
	}
});
router.post("/delete", async (req, res, next) => {
	const deletePostAction = "Delete post";
	const postId = req.body.postId;
	try {
		const result = await Post.findByIdAndDelete(postId);
		generalController.successResponse(res, 200, deletePostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, deletePostAction, err.message);
	}
});

module.exports = router;