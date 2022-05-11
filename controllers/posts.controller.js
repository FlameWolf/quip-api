"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { contentLengthRegExp, maxContentLength, quoteScore, replyScore, voteScore, repeatScore } = require("../library");
const postAggregationPipeline = require("../db/pipelines/post");
const userController = require("./users.controller");
const Post = require("../models/post.model");
const Vote = require("../models/vote.model");
const User = require("../models/user.model");
const Favourite = require("../models/favourite.model");
const Bookmark = require("../models/bookmark.model");
const MutedPost = require("../models/muted.post.model");

const validateContent = (content, attachment = {}) => {
	if (!content) {
		const { poll, mediaFile, post } = attachment;
		if (poll || !(mediaFile || post)) {
			throw new Error("No content");
		}
	}
	if (content?.match(contentLengthRegExp) > maxContentLength) {
		throw new Error("Content too long");
	}
};
const updateMentionsAndHashtags = async (content, post) => {
	const userIds = new Set(post.mentions);
	const hashtags = new Set(post.hashtags);
	for (const word of content.split(/\s+|\.+/)) {
		if (word.startsWith("@")) {
			const handle = word.match(/\w+/g).shift();
			if (handle) {
				const user = await userController.findUserByHandle(handle);
				if (user) {
					userIds.add(user._id);
				}
			}
		}
		if (word.startsWith("#")) {
			const hashtag = word.match(/\w+/g).shift();
			if (hashtag) {
				hashtags.add(hashtag);
			}
		}
	}
	post.mentions = userIds.size > 0 ? [...userIds] : undefined;
	post.hashtags = hashtags.size > 0 ? [...hashtags] : undefined;
};
const deletePostWithCascade = async post => {
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		const postId = post._id;
		const postFilter = { post: postId };
		const quotedPostId = post.attachments?.post;
		const repliedToPostId = post.replyTo;
		await Post.deleteOne(post).session(session);
		if (quotedPostId) {
			await Post.findByIdAndUpdate(quotedPostId, {
				$inc: {
					score: -quoteScore
				}
			}).session(session);
		}
		if (repliedToPostId) {
			await Post.findByIdAndUpdate(repliedToPostId, {
				$inc: {
					score: -replyScore
				}
			}).session(session);
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
			Favourite.deleteMany(postFilter).session(session),
			Bookmark.deleteMany(postFilter).session(session),
			MutedPost.deleteMany(postFilter).session(session)
		]);
	});
	await session.endSession();
};
const createPost = async (req, res, next) => {
	const { content, poll, "media-description": mediaDescription } = req.body;
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
			...((poll || media) && {
				attachments: {
					...(poll && {
						poll: JSON.parse(poll)
					}),
					...(media && {
						mediaFile: {
							fileType: req.fileType,
							src: media.linkUrl,
							description: mediaDescription
						}
					})
				}
			})
		}).save();
		if (content) {
			await updateMentionsAndHashtags(content, post);
		}
		res.status(201).json({ post });
	} catch (err) {
		next(err);
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
	const { content, poll, "media-description": mediaDescription } = req.body;
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
		const originalPost = await Post.findById(postId);
		if (!originalPost) {
			res.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const quote = await new Post({
				content,
				author: userId,
				attachments: {
					...(poll && {
						poll: JSON.parse(poll)
					}),
					...(media && {
						mediaFile: {
							fileType: req.fileType,
							src: media.linkUrl,
							description: mediaDescription
						}
					}),
					post: postId
				}
			}).save({ session });
			quote.mentions = [originalPost.author];
			if (content) {
				await updateMentionsAndHashtags(content, quote);
			}
			originalPost.score += quoteScore;
			await originalPost.save({ session });
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
			const result = await Post.deleteOne(payload).session(session);
			const repeated = await new Post(payload).save({ session });
			if (result.deletedCount === 0) {
				await Post.findByIdAndUpdate(postId, {
					$inc: {
						score: repeatScore
					}
				}).session(session);
			}
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
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unrepeated = await Post.findOneAndDelete({
				author: userId,
				repeatPost: postId
			}).session(session);
			if (unrepeated) {
				await Post.findByIdAndUpdate(postId, {
					$inc: {
						score: -repeatScore
					}
				}).session(session);
			}
			res.status(200).json({ unrepeated });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const replyToPost = async (req, res, next) => {
	const { content, poll, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	const session = await mongoose.startSession();
	try {
		const originalPost = await Post.findById(postId);
		if (!originalPost) {
			res.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const reply = await new Post({
				content,
				author: userId,
				replyTo: postId,
				...((poll || media) && {
					attachments: {
						...(poll && {
							poll: JSON.parse(poll)
						}),
						...(media && {
							mediaFile: {
								fileType: req.fileType,
								src: media.linkUrl,
								description: mediaDescription
							}
						})
					}
				})
			}).save({ session });
			reply.mentions = [originalPost.author];
			if (content) {
				await updateMentionsAndHashtags(content, reply);
			}
			await Post.findOneAndUpdate(postId, {
				$inc: {
					score: replyScore
				}
			}).session(session);
			res.status(201).json({ reply });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const castVote = async (req, res, next) => {
	const postId = req.params.postId;
	const option = req.query.option;
	const userId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		const post = await Post.findById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		const poll = post.attachments?.poll;
		if (!poll) {
			res.status(422).send("Post does not contain a poll");
			return;
		}
		if (post.author.valueOf() === userId) {
			res.status(403).send("User cannot vote on their own poll");
			return;
		}
		const pollExpiryDate = post.createdAt;
		pollExpiryDate.setMilliseconds(pollExpiryDate.getMilliseconds() + poll.duration);
		if (new Date() > pollExpiryDate) {
			res.status(422).send("Poll has expired");
			return;
		}
		await session.withTransaction(async () => {
			const vote = await new Vote({
				poll: poll._id,
				user: userId,
				option
			}).save({ session });
			if (option !== "nota") {
				await Post.findByIdAndUpdate(postId, {
					$inc: {
						score: voteScore
					}
				}).session(session);
			}
			res.status(201).json({ vote });
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
	castVote,
	deletePost
};