"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const generalController = require("./general.controller");
const Post = require("../models/post.model");
const Attachments = require("../models/attachments.model");

const validateContent = content => {
	if (!content) {
		throw new Error("No content");
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		throw new Error("Content too long");
	}
};
const createPost = async (req, res, next) => {
	const createPostAction = "Create post";
	const content = req.body.content;
	const userId = req.userInfo.userId;
	try {
		validateContent(content);
	} catch (err) {
		generalController.sendResponse(res, 400, createPostAction, err);
		return;
	}
	try {
		const post = await new Post({ content, author: userId }).save();
		generalController.sendResponse(res, 201, createPostAction, { post });
	} catch (err) {
		generalController.sendResponse(res, 500, createPostAction, err);
	}
};
const getPost = async (req, res, next) => {
	const getPostAction = "Get post";
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		await post.populate([
			{
				path: "author"
			},
			{
				path: "attachments",
				populate: [
					{
						path: "post",
						populate: {
							path: "author"
						}
					},
					{
						path: "media"
					}
				]
			}
		]);
		if (!post) {
			generalController.sendResponse(res, 404, getPostAction, "Post not found");
			return;
		}
		generalController.sendResponse(res, 200, getPostAction, { post });
	} catch (err) {
		generalController.sendResponse(res, 500, getPostAction, err);
	}
};
const quotePost = async (req, res, next) => {
	const quotePostAction = "Quote post";
	const postId = req.params.postId;
	const content = req.body.content;
	const userId = req.userInfo.userId;
	const postToQuote = await Post.findById(postId);
	if (!postToQuote) {
		generalController.sendResponse(res, 404, quotePostAction, "Post not found");
		return;
	}
	try {
		validateContent(content);
	} catch (err) {
		generalController.sendResponse(res, 400, quotePostAction, err);
		return;
	}
	try {
		const attachments = await new Attachments({
			post: postId
		}).save();
		const post = await new Post({
			content,
			author: userId,
			attachments
		}).save();
		generalController.sendResponse(res, 201, quotePostAction, { post });
	} catch (err) {
		generalController.sendResponse(res, 500, quotePostAction, err);
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
			generalController.sendResponse(res, 404, repeatPostAction, "Post not found");
			return;
		}
		await Post.deleteOne(payload);
		const repeated = await new Post(payload).save();
		generalController.sendResponse(res, 201, repeatPostAction, { repeated });
	} catch (err) {
		generalController.sendResponse(res, 500, repeatPostAction, err);
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
		generalController.sendResponse(res, 200, unrepeatPostAction, { unrepeated });
	} catch (err) {
		generalController.sendResponse(res, 500, unrepeatPostAction, err);
	}
};
const replyToPost = async (req, res, next) => {
	const replyToPostAction = "Reply to post";
	const content = req.body.content;
	const replyTo = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		validateContent(content);
	} catch (err) {
		generalController.sendResponse(res, 400, replyToPostAction, err);
		return;
	}
	if (!(await Post.findById(replyTo))) {
		generalController.sendResponse(res, 404, replyToPostAction, "Post not found");
		return;
	}
	try {
		const reply = await new Post({ content, author: userId, replyTo }).save();
		generalController.sendResponse(res, 201, replyToPostAction, { reply });
	} catch (err) {
		generalController.sendResponse(res, 500, replyToPostAction, err);
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
			generalController.sendResponse(res, 404, deletePostAction, "Post not found");
			return;
		}
		const deleted = await Post.findOneAndDelete(post);
		generalController.sendResponse(res, 200, deletePostAction, { deleted });
	} catch (err) {
		generalController.sendResponse(res, 500, deletePostAction, err);
	}
};

module.exports = {
	createPost,
	getPost,
	quotePost,
	repeatPost,
	unrepeatPost,
	replyToPost,
	deletePost
};