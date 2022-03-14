"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const generalController = require("./general.controller");
const Post = require("../models/post.model");

const validateContent = content => {
	if (!content) {
		generalController.failureResponse(res, 400, createPostAction, "No content");
		return false;
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		generalController.failureResponse(res, 400, createPostAction, "Content too long");
		return false;
	}
	return true;
};
const createPost = async (req, res, next) => {
	const createPostAction = "Create post";
	const content = req.body.content;
	const userId = req.userInfo.userId;
	if (!validateContent(content)) {
		return;
	}
	try {
		const post = await new Post({ content, author: userId }).save();
		generalController.successResponse(res, 201, createPostAction, { post });
	} catch (err) {
		generalController.failureResponse(res, 500, createPostAction, err.message);
	}
};
const getPost = async (req, res, next) => {
	const getPostAction = "Get post";
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			generalController.failureResponse(res, 404, getPostAction, "Post not found");
			return;
		}
		generalController.successResponse(res, 200, getPostAction, { post });
	} catch (err) {
		generalController.failureResponse(res, 500, getPostAction, err.message);
	}
};
const repeatPost = async (req, res, next) => {
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
		const repeated = await new Post(payload).save();
		generalController.successResponse(res, 201, repeatPostAction, { repeated });
	} catch (err) {
		generalController.failureResponse(res, 500, repeatPostAction, err.message);
	}
};
const unrepeatPost = async (req, res, next) => {
	const unrepeatPostAction = "Undo repeat";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unrepeated = await Post.findOneAndDelete({
			author: userId,
			repeatPost: postId
		});
		generalController.successResponse(res, 200, unrepeatPostAction, { unrepeated });
	} catch (err) {
		generalController.failureResponse(res, 500, unrepeatPostAction, err.message);
	}
};
const replyToPost = async (req, res, next) => {
	const replyToPostAction = "Reply to post";
	const content = req.body.content;
	const replyTo = req.params.postId;
	const userId = req.userInfo.userId;
	if (!validateContent(content)) {
		return;
	}
	if (!(await Post.findById(replyTo))) {
		generalController.failureResponse(res, 404, replyToPostAction, "Post not found");
		return;
	}
	try {
		const reply = await new Post({ content, author: userId, replyTo }).save();
		generalController.successResponse(res, 201, replyToPostAction, { reply });
	} catch (err) {
		generalController.failureResponse(res, 500, replyToPostAction, err.message);
	}
};
const deletePost = async (req, res, next) => {
	const deletePostAction = "Delete post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const post = await Post.findOne({
			_id: postId,
			author: userId
		});
		if (!post) {
			generalController.failureResponse(res, 404, deletePostAction, "Post not found");
			return;
		}
		const deleted = await Post.deleteOne(post);
		generalController.successResponse(res, 200, deletePostAction, { deleted });
	} catch (err) {
		generalController.failureResponse(res, 500, deletePostAction, err.message);
	}
};

module.exports = {
	createPost,
	getPost,
	repeatPost,
	unrepeatPost,
	replyToPost,
	deletePost
};