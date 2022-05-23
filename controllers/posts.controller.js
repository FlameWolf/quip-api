"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const cld = require("cld");
const { contentLengthRegExp, maxContentLength, quoteScore, replyScore, voteScore, repeatScore } = require("../library");
const postAggregationPipeline = require("../db/pipelines/post");
const postRepliesAggregationPipeline = require("../db/pipelines/post-replies");
const postParentAggregationPipeline = require("../db/pipelines/post-parent");
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
const updateLanguages = async (content, post) => {
	try {
		post.languages = (await cld.detect(content)).languages.map(x => x.code);
	} catch {
		post.languages = ["xx"];
	}
};
const updateMentionsAndHashtags = async (content, post) => {
	const postMentions = new Set(post.mentions);
	const postHashtags = new Set(post.hashtags);
	const contentMentions = content.match(/\B@\w+[^\p{P}]/g);
	const contentHashtags = content.match(/\B#(\p{L}\p{M}?)+[^\p{P}]/gu);
	if (contentMentions) {
		const users = await User.find(
			{
				handle: {
					$in: contentMentions.map(mention => mention.substring(1))
				},
				deactivated: false,
				deleted: false
			},
			{
				_id: 1
			}
		);
		users.map(user => user._id.valueOf()).forEach(userId => postMentions.add(userId));
	}
	if (contentHashtags) {
		contentHashtags.map(hashtag => hashtag.substring(1)).forEach(hashtag => postHashtags.add(hashtag));
	}
	post.mentions = postMentions.size > 0 ? [...postMentions] : undefined;
	post.hashtags = postHashtags.size > 0 ? [...postHashtags] : undefined;
};
const deletePostWithCascade = async post => {
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		const postId = post._id;
		const postFilter = { post: postId };
		const repliedToPostId = post.replyTo;
		const attachments = post.attachments;
		await Post.deleteOne(post).session(session);
		if (repliedToPostId) {
			await Post.findByIdAndUpdate(repliedToPostId, {
				$inc: {
					score: -replyScore
				}
			}).session(session);
		}
		if (attachments) {
			const quotedPostId = attachments.post;
			const poll = attachments.poll;
			if (quotedPostId) {
				await Post.findByIdAndUpdate(quotedPostId, {
					$inc: {
						score: -quoteScore
					}
				}).session(session);
			}
			if (poll) {
				await Vote.deleteMany({ poll: poll._id }).session(session);
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
			Favourite.deleteMany(postFilter).session(session),
			Bookmark.deleteMany(postFilter).session(session),
			MutedPost.deleteMany(postFilter).session(session)
		]);
	});
	await session.endSession();
};
const createPost = async (req, res, next) => {
	const { content, poll, "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	try {
		const model = {
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
			}),
			...(location && {
				location: JSON.parse(location)
			})
		};
		if (content?.trim()) {
			await Promise.all([updateLanguages(content, model), updateMentionsAndHashtags(content, model)]);
		}
		const post = await new Post(model).save();
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
const getPostReplies = async (req, res, next) => {
	const postId = req.params.postId;
	const lastReplyId = req.query.lastReplyId;
	try {
		if (!(await Post.countDocuments({ _id: postId }))) {
			res.status(404).send("Post not found");
			return;
		}
		const replies = await Post.aggregate(postRepliesAggregationPipeline(postId, req.userInfo?.userId, lastReplyId));
		res.status(200).json({ replies });
	} catch (err) {
		next(err);
	}
};
const getPostParent = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		if (!post.replyTo) {
			res.status(422).send("Post is not a reply");
			return;
		}
		const parent = (await Post.aggregate(postParentAggregationPipeline(postId, req.userInfo?.userId))).shift();
		res.status(200).json({ parent });
	} catch (err) {
		next(err);
	}
};
const quotePost = async (req, res, next) => {
	const postId = req.params.postId;
	const { content, poll, "media-description": mediaDescription, location } = req.body;
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
			const model = {
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
				},
				...(location && {
					location: JSON.parse(location)
				})
			};
			model.mentions = [originalPost.author];
			if (content?.trim()) {
				await Promise.all([updateLanguages(content, model), updateMentionsAndHashtags(content, model)]);
			}
			const quote = await new Post(model).save({ session });
			await Post.findByIdAndUpdate(postId, {
				$inc: {
					score: quoteScore
				}
			}).session(session);
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
	const { content, poll, "media-description": mediaDescription, location } = req.body;
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
			const model = {
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
				}),
				...(location && {
					location: JSON.parse(location)
				})
			};
			model.mentions = [originalPost.author];
			if (content?.trim()) {
				await Promise.all([updateLanguages(content, model), updateMentionsAndHashtags(content, model)]);
			}
			const reply = await new Post(model).save({ session });
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
		const isOptionNota = option === "nota";
		if (!(isOptionNota || poll[option])) {
			res.status(422).send("Poll does not contain the specified option");
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
			poll.votes[option] += 1;
			await post.save({ session });
			if (!isOptionNota) {
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
	getPostReplies,
	getPostParent,
	quotePost,
	repeatPost,
	unrepeatPost,
	replyToPost,
	castVote,
	deletePost
};