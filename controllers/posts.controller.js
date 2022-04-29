"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const userController = require("./users.controller");
const Post = require("../models/post.model");
const MediaFile = require("../models/media-file.model");
const Attachments = require("../models/attachments.model");
const Mention = require("../models/mention.model");

const validateContent = (content, attachment = undefined) => {
	if (!(content || attachment)) {
		throw new Error("No content");
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		throw new Error("Content too long");
	}
};
const updateMentions = async (content, postId) => {
	for (const word of content.split(/\s+|\.+/)) {
		if (word.startsWith("@")) {
			const handle = word.match(/\w+/g).shift();
			if (handle) {
				const user = await userController.findUserByHandle(handle);
				if (user) {
					new Mention({
						post: postId,
						menioned: user._id
					}).save();
				}
			}
		}
	}
};
const createMediaAttachment = async (fileType, src, description) => {
	const mediaFile = await new MediaFile({ fileType, src, description }).save();
	return await new Attachments({ mediaFile }).save();
};
const createPost = async (req, res, next) => {
	const { content, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	try {
		const post = await new Post({
			content,
			author: userId,
			...(media && {
				attachments: await createMediaAttachment(req.fileType, media.linkUrl, mediaDescription)
			})
		}).save();
		res.status(201).json({ post });
		if (content) {
			updateMentions(content, post._id);
		}
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
						populate: [
							{
								path: "author"
							},
							{
								path: "attachments",
								populate: [
									{
										path: "mediaFile"
									}
								]
							}
						]
					},
					{
						path: "mediaFile"
					}
				]
			}
		]);
		res.status(200).json({ post });
	} catch (err) {
		res.status(500).send(err);
	}
};
const quotePost = async (req, res, next) => {
	const postId = req.params.postId;
	const { content, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const userId = req.userInfo.userId;
	const originalPost = await Post.findById(postId);
	if (!originalPost) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	try {
		const attachments = media ? await createMediaAttachment(req.fileType, media.linkUrl, mediaDescription) : new Attachments();
		attachments.post = postId;
		await attachments.save();
		const quote = await new Post({
			content,
			author: userId,
			attachments
		}).save();
		res.status(201).json({ quote });
		const quoteId = quote._id;
		new Mention({
			post: quoteId,
			mentioned: originalPost.author
		}).save();
		if (content) {
			updateMentions(content, quoteId);
		}
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
const isRepeated = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const count = await Post.countDocuments({
			author: userId,
			repeatPost: postId
		});
		res.status(200).send(count);
	} catch (err) {
		res.status(500).send(err);
	}
};
const replyToPost = async (req, res, next) => {
	const { content, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const replyTo = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	const originalPost = await Post.findById(replyTo);
	if (!originalPost) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		const reply = await new Post({
			content,
			author: userId,
			replyTo,
			...(media && {
				attachments: await createMediaAttachment(req.fileType, media.linkUrl, mediaDescription)
			})
		}).save();
		res.status(201).json({ reply });
		const replyId = reply._id;
		new Mention({
			post: replyId,
			mentioned: originalPost.author
		}).save();
		if (content) {
			updateMentions(content, replyId);
		}
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
		Mention.deleteMany({ post: postId });
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
	isRepeated,
	replyToPost,
	deletePost
};