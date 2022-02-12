"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const generalController = require("../controllers/general.controller");
const Post = require("../models/post.model");

router.post("/create", authenticateRequest, async (req, res, next) => {
	const createPostAction = "Create post";
	const content = req.body.content;
	const author = req.userInfo.userId;
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
router.get("/:postId", async (req, res, next) => {
	const getPostAction = "Get post";
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		generalController.successResponse(res, 200, getPostAction, post);
	} catch (err) {
		generalController.failureResponse(res, 500, getPostAction, err.message);
	}
});
router.get("/favourite/:postId", authenticateRequest, async (req, res, next) => {
	const favouritePostAction = "Add favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const result = await Post.findByIdAndUpdate(postId, { $addToSet: { favouritedBy: userId } });
		generalController.successResponse(res, 200, favouritePostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, favouritePostAction, err.message);
	}
});
router.get("/unfavourite/:postId", authenticateRequest, async (req, res, next) => {
	const unfavouritePostAction = "Remove favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const result = await Post.findByIdAndUpdate(postId, { $pull: { favouritedBy: userId } });
		generalController.successResponse(res, 200, unfavouritePostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, unfavouritePostAction, err.message);
	}
});
router.get("/repeat/:postId", authenticateRequest, async (req, res, next) => {
	const repeatPostAction = "Repeat";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
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
router.get("/unrepeat/:postId", authenticateRequest, async (req, res, next) => {
	const unrepeatPostAction = "Undo repeat";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
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
router.get("/delete/:postId", authenticateRequest, async (req, res, next) => {
	const deletePostAction = "Delete post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const result = await Post.deleteOne({
			_id: postId,
			author: userId
		});
		generalController.successResponse(res, 200, deletePostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, deletePostAction, err.message);
	}
});

module.exports = router;