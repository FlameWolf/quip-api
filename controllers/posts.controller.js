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
	} catch (error) {
		res.status(400).send(error);
		return;
	}
	try {
		const post = await new Post({ content, author: userId }).save();
		res.status(201).json({ post });
	} catch (error) {
		res.status(500).send(error);
	}
};
const getPost = async (req, res, next) => {
	const getPostAction = "Get post";
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
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
			res.status(404).send("Post not found");
			return;
		}
		res.status(200).json({ post });
	} catch (error) {
		res.status(500).send(error);
	}
};
const quotePost = async (req, res, next) => {
	const quotePostAction = "Quote post";
	const postId = req.params.postId;
	const content = req.body.content;
	const userId = req.userInfo.userId;
	const postToQuote = await Post.findById(postId);
	if (!postToQuote) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		validateContent(content);
	} catch (error) {
		res.status(400).send(error);
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
		res.status(201).json({ post });
	} catch (error) {
		res.status(500).send(error);
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
			res.status(404).send("Post not found");
			return;
		}
		await Post.deleteOne(payload);
		const repeated = await new Post(payload).save();
		res.status(201).json({ repeated });
	} catch (error) {
		res.status(500).send(error);
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
		res.status(200).json({ unrepeated });
	} catch (error) {
		res.status(500).send(error);
	}
};
const replyToPost = async (req, res, next) => {
	const replyToPostAction = "Reply to post";
	const content = req.body.content;
	const replyTo = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		validateContent(content);
	} catch (error) {
		res.status(400).send(error);
		return;
	}
	if (!(await Post.findById(replyTo))) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		const reply = await new Post({ content, author: userId, replyTo }).save();
		res.status(201).json({ reply });
	} catch (error) {
		res.status(500).send(error);
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
			res.status(404).send("Post not found");
			return;
		}
		const deleted = await Post.findOneAndDelete(post);
		res.status(200).json({ deleted });
	} catch (error) {
		res.status(500).send(error);
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