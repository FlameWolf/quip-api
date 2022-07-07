"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const cld = require("cld");
const { contentLengthRegExp, maxContentLength, quoteScore, replyScore, voteScore, repeatScore, nullId } = require("../library");
const postAggregationPipeline = require("../db/pipelines/post");
const postQuotesAggregationPipeline = require("../db/pipelines/post-quotes");
const postRepliesAggregationPipeline = require("../db/pipelines/post-replies");
const postParentAggregationPipeline = require("../db/pipelines/post-parent");
const Post = require("../models/post.model");
const Vote = require("../models/vote.model");
const User = require("../models/user.model");
const Favourite = require("../models/favourite.model");
const Bookmark = require("../models/bookmark.model");
const MutedPost = require("../models/muted.post.model");

const findPostById = async postId => {
	const post = await Post.findById(postId);
	const repeatPost = post?.repeatPost;
	return repeatPost ? await findPostById(repeatPost) : post;
};
const validateContent = (content, attachment = {}) => {
	if (!content.trim()) {
		const { poll, mediaFile, post } = attachment;
		if (poll || !(mediaFile || post)) {
			throw new Error("No content");
		}
	}
	if (content.match(contentLengthRegExp)?.length > maxContentLength) {
		throw new Error("Content too long");
	}
};
const detectLanguages = async value => {
	if (value.trim()) {
		try {
			return (
				await cld.detect(value, {
					isHTML: false,
					languageHint: "",
					encodingHint: "",
					tldHint: "",
					httpHint: ""
				})
			).languages.map(language => language.code);
		} catch {
			return ["xx"];
		}
	}
	return [];
};
const updateLanguages = async post => {
	const languages = new Set(post.languages);
	const promises = [];
	const { content, attachments } = post;
	promises.push(content && detectLanguages(content));
	if (attachments) {
		const { poll, mediaFile } = attachments;
		if (poll) {
			const { first, second, third, fourth } = poll;
			promises.push(first && detectLanguages(first), second && detectLanguages(second), third && detectLanguages(third), fourth && detectLanguages(fourth));
		}
		if (mediaFile) {
			const mediaDescription = mediaFile.description;
			promises.push(mediaDescription && detectLanguages(mediaDescription));
		}
	}
	for (const language of (await Promise.all(promises)).flat()) {
		if (language) {
			languages.add(language);
		}
	}
	post.languages = [...languages];
};
const updateMentionsAndHashtags = async (content, post) => {
	const postMentions = new Set(post.mentions);
	const postHashtags = new Set(post.hashtags);
	const contentMentions = content.match(/\B@\w+/g);
	const contentHashtags = content.match(/\B#(\p{L}\p{M}?)+/gu);
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
		const repeatedPostId = post.repeatPost;
		const repliedToPostId = post.replyTo;
		const attachments = post.attachments;
		await Post.deleteOne(post).session(session);
		if (repeatedPostId) {
			await Post.findByIdAndUpdate(repeatedPostId, {
				$inc: {
					score: -repeatScore
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
	const { content = "", poll, "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
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
						src: media.path,
						description: mediaDescription
					}
				})
			}
		}),
		...(location && {
			location: JSON.parse(location)
		})
	};
	await Promise.all([updateLanguages(model), content.trim() && updateMentionsAndHashtags(content, model)]);
	const post = await new Post(model).save();
	res.status(201).json({ post });
};
const updatePost = async (req, res, next) => {
	const postId = req.params.postId;
	const content = req.body.content || "";
	const session = await mongoose.startSession();
	try {
		if (!content.trim()) {
			res.status(400).send("No content");
			return;
		}
		const post = await findPostById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		if (post.author.valueOf() !== req.userInfo.userId) {
			res.status(403).send("You are not allowed to perform this action");
			return;
		}
		if (post.__v > 0) {
			res.status(422).send("Post was edited once and cannot be edited again");
			return;
		}
		const { poll, mediaFile, post: quotedPostId } = post.attachments || {};
		if (poll) {
			res.status(422).send("Cannot edit a post that includes a poll");
			return;
		}
		if (post.content === content) {
			res.status(304).send({ post });
			return;
		}
		await session.withTransaction(async () => {
			const originalPostId = post._id;
			const postFilter = { post: originalPostId };
			const repliedPostId = post.replyTo;
			const mentions = [];
			if (repliedPostId) {
				mentions.push((await Post.findById(repliedPostId))?.author || nullId);
			}
			if (quotedPostId) {
				mentions.push((await Post.findById(quotedPostId))?.author || nullId);
			}
			const model = {
				content,
				...(mediaFile && {
					attachments: {
						mediaFile: { description: mediaFile.description }
					}
				}),
				mentions,
				score: 0,
				$inc: { __v: 1 }
			};
			await Promise.all([updateLanguages(model), updateMentionsAndHashtags(content, model)]);
			delete model.attachments;
			const updated = await Post.findByIdAndUpdate(originalPostId, model, { new: true }).session(session);
			await Promise.all([
				Post.updateMany({ "attachments.post": originalPostId }, { "attachments.post": nullId }).session(session),
				Post.updateMany({ replyTo: originalPostId }, { replyTo: nullId }).session(session),
				Post.deleteMany({
					repeatPost: originalPostId
				}).session(session),
				Favourite.deleteMany(postFilter).session(session),
				Bookmark.deleteMany(postFilter).session(session)
			]);
			res.status(200).json({ updated });
		});
	} finally {
		await session.endSession();
	}
};
const getPost = async (req, res, next) => {
	const postId = req.params.postId;
	const originalPost = await findPostById(postId);
	if (!originalPost) {
		res.status(404).send("Post not found");
		return;
	}
	const post = (
		await Post.aggregate([
			{
				$match: {
					_id: new ObjectId(originalPost._id)
				}
			},
			...postAggregationPipeline(req.userInfo?.userId)
		])
	).shift();
	res.status(200).json({ post });
};
const getPostQuotes = async (req, res, next) => {
	const postId = req.params.postId;
	const lastQuoteId = req.query.lastQuoteId;
	const post = await findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const quotes = await Post.aggregate(postQuotesAggregationPipeline(post._id, req.userInfo?.userId, lastQuoteId));
	res.status(200).json({ quotes });
};
const getPostReplies = async (req, res, next) => {
	const postId = req.params.postId;
	const lastReplyId = req.query.lastReplyId;
	const post = await findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const replies = await Post.aggregate(postRepliesAggregationPipeline(post._id, req.userInfo?.userId, lastReplyId));
	res.status(200).json({ replies });
};
const getPostParent = async (req, res, next) => {
	const postId = req.params.postId;
	const post = await findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	if (!post.replyTo) {
		res.status(422).send("Post is not a reply");
		return;
	}
	const parent = (await Post.aggregate(postParentAggregationPipeline(post._id, req.userInfo?.userId))).shift();
	res.status(200).json({ parent });
};
const quotePost = async (req, res, next) => {
	const postId = req.params.postId;
	const { content = "", poll, "media-description": mediaDescription, location } = req.body;
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
		const originalPost = await findPostById(postId);
		if (!originalPost) {
			res.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const originalPostId = originalPost._id;
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
							src: media.path,
							description: mediaDescription
						}
					}),
					post: originalPostId
				},
				languages: originalPost.languages,
				...(location && {
					location: JSON.parse(location)
				}),
				mentions: [originalPost.author]
			};
			await Promise.all([updateLanguages(model), content.trim() && updateMentionsAndHashtags(content, model)]);
			const quote = await new Post(model).save({ session });
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: quoteScore
				}
			}).session(session);
			res.status(201).json({ quote });
		});
	} finally {
		await session.endSession();
	}
};
const repeatPost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		const originalPost = await findPostById(postId);
		if (!originalPost) {
			res.status(404).send("Post not found");
			return;
		}
		const originalPostId = originalPost._id;
		const payload = {
			author: userId,
			repeatPost: originalPostId
		};
		await session.withTransaction(async () => {
			const result = await Post.deleteOne(payload).session(session);
			const repeated = await new Post(payload).save({ session });
			if (result.deletedCount === 0) {
				await Post.findByIdAndUpdate(originalPostId, {
					$inc: {
						score: repeatScore
					}
				}).session(session);
			}
			res.status(201).json({ repeated });
		});
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
	} finally {
		await session.endSession();
	}
};
const replyToPost = async (req, res, next) => {
	const { content = "", poll, "media-description": mediaDescription, location } = req.body;
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
		const originalPost = await findPostById(postId);
		if (!originalPost) {
			res.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const originalPostId = originalPost._id;
			const model = {
				content,
				author: userId,
				replyTo: originalPostId,
				...((poll || media) && {
					attachments: {
						...(poll && {
							poll: JSON.parse(poll)
						}),
						...(media && {
							mediaFile: {
								fileType: req.fileType,
								src: media.path,
								description: mediaDescription
							}
						})
					}
				}),
				...(location && {
					location: JSON.parse(location)
				}),
				mentions: [originalPost.author]
			};
			await Promise.all([updateLanguages(model), content.trim() && updateMentionsAndHashtags(content, model)]);
			const reply = await new Post(model).save({ session });
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: replyScore
				}
			}).session(session);
			res.status(201).json({ reply });
		});
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
		const post = await findPostById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		const poll = post.attachments?.poll;
		if (!poll) {
			res.status(422).send("Post does not include a poll");
			return;
		}
		const isOptionNota = option === "nota";
		if (!(isOptionNota || poll[option])) {
			res.status(422).send("Poll does not include the specified option");
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
			if (!isOptionNota) {
				await Post.findByIdAndUpdate(post._id, {
					$inc: {
						[`poll.votes.${option}`]: 1,
						score: voteScore
					}
				}).session(session);
			}
			res.status(201).json({ vote });
		});
	} finally {
		await session.endSession();
	}
};
const deletePost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
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
};

module.exports = {
	findPostById,
	createPost,
	updatePost,
	getPost,
	getPostQuotes,
	getPostReplies,
	getPostParent,
	quotePost,
	repeatPost,
	unrepeatPost,
	replyToPost,
	castVote,
	deletePost
};