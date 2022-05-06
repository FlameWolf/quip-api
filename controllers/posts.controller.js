"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { contentLengthRegExp, maxContentLength } = require("../library");
const postAggregationPipeline = require("../db/pipelines/post");
const userController = require("./users.controller");
const Post = require("../models/post.model");
const MediaFile = require("../models/media-file.model");
const Attachments = require("../models/attachments.model");
const Mention = require("../models/mention.model");
const User = require("../models/user.model");
const Favourite = require("../models/favourite.model");
const Bookmark = require("../models/bookmark.model");
const MutedPost = require("../models/muted.post.model");

const validateContent = (content, attachment = undefined) => {
	if (!(content || attachment)) {
		throw new Error("No content");
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		throw new Error("Content too long");
	}
};
const updateMentions = async (content, postId, session) => {
	const userIds = [];
	for (const word of content.split(/\s+|\.+/)) {
		if (word.startsWith("@")) {
			const handle = word.match(/\w+/g).shift();
			if (handle) {
				const user = await userController.findUserByHandle(handle);
				if (user) {
					userIds.push(user._id);
				}
			}
		}
	}
	await new Mention({
		post: postId,
		mentioned: userIds
	}).save({ session });
};
const createMediaAttachment = async (fileType, src, description, session) => {
	const mediaFile = await new MediaFile({ fileType, src, description }).save({ session });
	return await new Attachments({ mediaFile }).save({ session });
};
const deletePostWithCascade = async post => {
	const postId = post._id;
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		await Post.deleteOne(post).session(session);
		const postFilter = { post: postId };
		const attachmentsId = post.attachments;
		if (attachmentsId) {
			const attachments = await Attachments.findByIdAndDelete(attachmentsId).session(session);
			if (attachments) {
				const mediaFileId = attachments.mediaFile;
				if (mediaFileId) {
					await MediaFile.findByIdAndDelete(attachments.mediaFile).session(session);
				}
			}
		}
		await Promise.all([
			User.findOneAndUpdate(
				{
					pinnedPost: postId
				},
				{
					pinnedPost: undefined
				}
			).session(session),
			Post.deleteMany({
				repeatPost: postId
			}).session(session),
			Mention.deleteMany(postFilter).session(session),
			Favourite.deleteMany(postFilter).session(session),
			Bookmark.deleteMany(postFilter).session(session),
			MutedPost.deleteMany(postFilter).session(session)
		]);
	});
	await session.endSession();
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
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const post = await new Post({
				content,
				author: userId,
				...(media && {
					attachments: await createMediaAttachment(req.fileType, media.linkUrl, mediaDescription, session)
				})
			}).save({ session });
			if (content) {
				await updateMentions(content, post._id, session);
			}
			res.status(201).json({ post });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const getPost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		if (!(await Post.countDocuments({ _id: postId }))) {
			res.status(404).send("Post not found");
			return;
		}
		const post = (
			await Post.aggregate([
				{
					$match: {
						_id: ObjectId(postId)
					}
				},
				...postAggregationPipeline(req.userInfo?.userId)
			])
		).shift();
		res.status(200).json({ post });
	} catch (err) {
		next(err);
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
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const attachments = media ? await createMediaAttachment(req.fileType, media.linkUrl, mediaDescription, session) : new Attachments();
			attachments.post = postId;
			await attachments.save({ session });
			const quote = await new Post({
				content,
				author: userId,
				attachments
			}).save({ session });
			const quoteId = quote._id;
			await new Mention({
				post: quoteId,
				mentioned: [originalPost.author]
			}).save({ session });
			if (content) {
				await updateMentions(content, quoteId, session);
			}
			res.status(201).json({ quote });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const repeatPost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const payload = {
		author: userId,
		repeatPost: postId
	};
	const session = await mongoose.startSession();
	try {
		if (!(await Post.countDocuments({ _id: postId }))) {
			res.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			await Post.deleteOne(payload).session(session);
			const repeated = await new Post(payload).save({ session });
			res.status(201).json({ repeated });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
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
		next(err);
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
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const reply = await new Post({
				content,
				author: userId,
				replyTo,
				...(media && {
					attachments: await createMediaAttachment(req.fileType, media.linkUrl, mediaDescription, session)
				})
			}).save({ session });
			const replyId = reply._id;
			new Mention({
				post: replyId,
				mentioned: [originalPost.author]
			}).save({ session });
			if (content) {
				await updateMentions(content, replyId, session);
			}
			res.status(201).json({ reply });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const deletePost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		if (post.author !== userId) {
			res.status(403).send("You are not allowed to perform this action");
			return;
		}
		await deletePostWithCascade(post);
		res.status(200).json({ deleted: post });
	} catch (err) {
		next(err);
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