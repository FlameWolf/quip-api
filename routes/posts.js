"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const generalController = require("../controllers/general.controller");
const Post = require("../models/post.model");
const User = require("../models/user.model");

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
		const response = await model.save();
		generalController.successResponse(res, 201, createPostAction, { post: response });
	} catch (err) {
		generalController.failureResponse(res, 500, createPostAction, err.message);
	}
});
router.get("/:postId", async (req, res, next) => {
	const getPostAction = "Get post";
	const postId = req.params.postId;
	try {
		const response = await Post.findById(postId);
		if (!response) {
			generalController.failureResponse(res, 404, getPostAction, "Post not found");
			return;
		}
		generalController.successResponse(res, 200, getPostAction, { post: response });
	} catch (err) {
		generalController.failureResponse(res, 500, getPostAction, err.message);
	}
});
router.get("/favourite/:postId", authenticateRequest, async (req, res, next) => {
	const favouritePostAction = "Add favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const postUpdateResponse = await Post.findByIdAndUpdate(postId, { $addToSet: { favouritedBy: userId } }, { new: true });
		if (!postUpdateResponse) {
			generalController.failureResponse(res, 404, favouritePostAction, "Post not found");
			return;
		}
		const userUpdateResponse = await User.findByIdAndUpdate(userId, { $addToSet: { favourites: postId } }, { new: true });
		generalController.successResponse(res, 200, favouritePostAction, {
			result: {
				post: postUpdateResponse,
				user: userUpdateResponse
			}
		});
	} catch (err) {
		generalController.failureResponse(res, 500, favouritePostAction, err.message);
	}
});
router.get("/unfavourite/:postId", authenticateRequest, async (req, res, next) => {
	const unfavouritePostAction = "Remove favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const postUpdateResponse = await Post.findByIdAndUpdate(postId, { $pull: { favouritedBy: userId } }, { new: true });
		const userUpdateResponse = await User.findByIdAndUpdate(userId, { $pull: { favourites: postId } }, { new: true });
		generalController.successResponse(res, 200, unfavouritePostAction, {
			result: {
				post: postUpdateResponse,
				user: userUpdateResponse
			}
		});
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
		if (!(await Post.findById(postId))) {
			generalController.failureResponse(res, 404, repeatPostAction, "Post not found");
			return;
		}
		if (await Post.find(payload)) {
			await Post.deleteOne(payload);
		}
		const response = await new Post(payload).save();
		generalController.successResponse(res, 201, repeatPostAction, { post: response });
	} catch (err) {
		generalController.failureResponse(res, 500, repeatPostAction, err.message);
	}
});
router.get("/unrepeat/:postId", authenticateRequest, async (req, res, next) => {
	const unrepeatPostAction = "Undo repeat";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const response = await Post.deleteOne({
			author: userId,
			repeatPost: postId
		});
		generalController.successResponse(res, 201, unrepeatPostAction, response);
	} catch (err) {
		generalController.failureResponse(res, 500, unrepeatPostAction, err.message);
	}
});
router.get("/delete/:postId", authenticateRequest, async (req, res, next) => {
	const deletePostAction = "Delete post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const response = await Post.deleteOne({
			_id: postId,
			author: userId
		});
		generalController.successResponse(res, 200, deletePostAction, response);
	} catch (err) {
		generalController.failureResponse(res, 500, deletePostAction, err.message);
	}
});

module.exports = router;