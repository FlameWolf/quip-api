"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const Post = require("../models/post.model");
const Attachments = require("../models/attachments.model");

const validateContent = (content, attachment) => {
	if (!(content || attachment)) {
		throw new Error("No content");
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		throw new Error("Content too long");
	}
};
const createPost = async (req, res, next) => {
	const { content, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const mediaUrl = media && `${req.protocol}://${req.get("host")}/${req.fileType}s/${media.filename}`;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, mediaUrl);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	try {
		const post = await new Post({ content, author: userId }).save();
		res.status(201).json({ post });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getPost = async (req, res, next) => {
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
						path: "mediaFile"
					}
				]
			}
		]);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		res.status(200).json({ post });
	} catch (err) {
		res.status(500).send(err);
	}
};
const quotePost = async (req, res, next) => {
	const postId = req.params.postId;
	const content = req.body.content;
	const userId = req.userInfo.userId;
	const postToQuote = await Post.findById(postId);
	if (!postToQuote) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		validateContent(content, null);
	} catch (err) {
		res.status(400).send(err);
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
	} catch (err) {
		res.status(500).send(err);
	}
};
const repeatPost = async (req, res, next) => {
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
	} catch (err) {
		res.status(500).send(err);
	}
};
const unrepeatPost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unrepeated = await Post.findOneAndDelete({
			author: userId,
			repeatPost: postId
		});
		res.status(200).json({ unrepeated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const replyToPost = async (req, res, next) => {
	const content = req.body.content;
	const replyTo = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, null);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	if (!(await Post.findById(replyTo))) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		const reply = await new Post({ content, author: userId, replyTo }).save();
		res.status(201).json({ reply });
	} catch (err) {
		res.status(500).send(err);
	}
};
const deletePost = async (req, res, next) => {
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
	} catch (err) {
		res.status(500).send(err);
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