"use strict";

import { ObjectId } from "bson";
import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import * as cld from "cld";
import { v2 as cloudinary } from "cloudinary";
import { maxContentLength, nullId, quoteScore, replyScore, voteScore, repeatScore, getUnicodeClusterCount } from "../library";
import postAggregationPipeline from "../db/pipelines/post";
import postQuotesAggregationPipeline from "../db/pipelines/post-quotes";
import postRepliesAggregationPipeline from "../db/pipelines/post-replies";
import postParentAggregationPipeline from "../db/pipelines/post-parent";
import Post from "../models/post.model";
import Vote from "../models/vote.model";
import User from "../models/user.model";
import Favourite from "../models/favourite.model";
import Bookmark from "../models/bookmark.model";
import MutedPost from "../models/muted.post.model";
import { RequestHandler } from "express";

type PostModel = InferSchemaType<typeof Post.schema>;
type AttachmentsModel = Required<PostModel>["attachments"];
type PollModel = Required<AttachmentsModel & Dictionary>["poll"];
type LanguageEntry = InferArrayElementType<PostModel["languages"]>;
type MentionEntry = InferArrayElementType<PostModel["mentions"]>;
type HashtagEntry = InferArrayElementType<PostModel["hashtags"]>;

export const findPostById = async (postId: string | ObjectId): Promise<HydratedDocument<PostModel>> => {
	const post = await Post.findById(postId);
	const repeatPost = post?.repeatPost;
	return repeatPost ? await findPostById(repeatPost as ObjectId) : (post as HydratedDocument<PostModel>);
};
export const validateContent = (content: string, poll?: string, media?: MulterFile, postId?: string | ObjectId) => {
	if (!content.trim()) {
		if (poll || !(media || postId)) {
			throw new Error("No content");
		}
	}
	if (getUnicodeClusterCount(content) > maxContentLength) {
		throw new Error("Content too long");
	}
};
export const detectLanguages = async (value: string) => {
	if (value.trim()) {
		try {
			return (await cld.detect(value)).languages.map(language => language.code);
		} catch {
			return ["xx"];
		}
	}
	return [];
};
export const updateLanguages = async (post: Partial<PostModel> | DeepPartial<PostModel>) => {
	const languages = new Set(post.languages);
	const promises = [];
	const { content, attachments } = post;
	promises.push(content && (await detectLanguages(content)));
	if (attachments) {
		const { poll, mediaFile } = attachments;
		if (poll) {
			const { first, second, third, fourth } = poll;
			promises.push(first && (await detectLanguages(first)), second && (await detectLanguages(second)), third && (await detectLanguages(third)), fourth && (await detectLanguages(fourth)));
		}
		if (mediaFile) {
			const mediaDescription = mediaFile.description as string;
			promises.push(mediaDescription && (await detectLanguages(mediaDescription)));
		}
	}
	for (const language of (await Promise.all(promises)).flat()) {
		if (language) {
			languages.add(language as LanguageEntry);
		}
	}
	post.languages = [...languages];
};
export const updateMentionsAndHashtags = async (content: string, post: Partial<PostModel> | DeepPartial<PostModel>) => {
	const postMentions = new Set(post.mentions?.map(mention => mention?.toString()));
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
		users.map(user => user._id).forEach(userId => postMentions.add(userId.toString()));
	}
	if (contentHashtags) {
		contentHashtags.map(hashtag => hashtag.substring(1)).forEach(hashtag => postHashtags.add(hashtag as HashtagEntry));
	}
	post.mentions = postMentions.size > 0 ? [...postMentions].map(mention => new ObjectId(mention) as MentionEntry) : undefined;
	post.hashtags = postHashtags.size > 0 ? [...postHashtags] : undefined;
};
export const uploadFile = async (file: MulterFile) => {
	const fileType = file.type;
	const response = await cloudinary.uploader.upload(file.path, {
		resource_type: fileType as any,
		folder: `${fileType}s/`,
		use_filename: true
	});
	return response;
};
export const deletePostWithCascade = async (post: HydratedDocument<PostModel>) => {
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		const postId = post._id;
		const postFilter = { post: postId };
		const repeatedPostId = post.repeatPost;
		const repliedToPostId = post.replyTo;
		const attachments = post.attachments;
		await Post.deleteOne(post as PostModel).session(session);
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
			const poll = attachments.poll as HydratedDocument<PollModel>;
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
					_id: post.author
				},
				{
					$pull: {
						posts: postId
					}
				}
			).session(session),
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
export const createPost: RequestHandler = async (req, res, next) => {
	const { content = "", poll, "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = (req.userInfo as UserInfo).userId;
	try {
		validateContent(content, poll, media);
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
						fileType: media.type,
						src: (await uploadFile(media)).secure_url,
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
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		const post = await new Post(model).save({ session });
		await User.findOneAndUpdate(
			{
				_id: userId
			},
			{
				$addToSet: {
					posts: post._id
				}
			}
		).session(session);
		res.status(201).send({ post });
	});
	await session.endSession();
};
export const updatePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const content = req.body.content || "";
	const userId = (req.userInfo as UserInfo).userId;
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
		if (post.author.toString() !== userId) {
			res.status(403).send("You are not allowed to perform this action");
			return;
		}
		if (post.__v > 0) {
			res.status(422).send("Post was edited once and cannot be edited again");
			return;
		}
		const { poll = undefined, mediaFile = undefined, post: quotedPostId } = post.attachments || ({} as AttachmentsModel & Dictionary);
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
			const authorFilter = {
				author: {
					$nin: [userId]
				}
			};
			const postFilter = { post: originalPostId };
			const repliedPostId = post.replyTo;
			const mentions: Array<MentionEntry> = [];
			if (repliedPostId) {
				mentions.push(((await Post.findById(repliedPostId))?.author as MentionEntry) || nullId);
			}
			if (quotedPostId) {
				mentions.push(((await Post.findById(quotedPostId))?.author as MentionEntry) || nullId);
			}
			const model = {
				content,
				...(mediaFile && {
					attachments: {
						mediaFile: {
							description: mediaFile.description
						}
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
				Post.updateMany(
					{
						"attachments.post": originalPostId,
						...authorFilter
					},
					{
						"attachments.post": nullId
					}
				).session(session),
				Post.updateMany(
					{
						replyTo: originalPostId,
						...authorFilter
					},
					{
						replyTo: nullId
					}
				).session(session),
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
export const getPost: RequestHandler = async (req, res, next) => {
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
			...postAggregationPipeline((req.userInfo as UserInfo)?.userId)
		])
	).shift();
	res.status(200).json({ post });
};
export const getPostQuotes: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const lastQuoteId = req.query.lastQuoteId;
	const post = await findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const quotes = await Post.aggregate(postQuotesAggregationPipeline(post._id, (req.userInfo as UserInfo)?.userId, lastQuoteId as string));
	res.status(200).json({ quotes });
};
export const getPostReplies: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const lastReplyId = req.query.lastReplyId;
	const post = await findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	const replies = await Post.aggregate(postRepliesAggregationPipeline(post._id, (req.userInfo as UserInfo)?.userId, lastReplyId as string));
	res.status(200).json({ replies });
};
export const getPostParent: RequestHandler = async (req, res, next) => {
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
	const parent = (await Post.aggregate(postParentAggregationPipeline(post._id, (req.userInfo as UserInfo)?.userId))).shift();
	res.status(200).json({ parent });
};
export const quotePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const { content = "", poll, "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = (req.userInfo as UserInfo).userId;
	try {
		validateContent(content, poll, media, postId);
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
							fileType: media.type,
							src: (await uploadFile(media)).secure_url,
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
			await User.findOneAndUpdate(
				{
					_id: userId
				},
				{
					$addToSet: {
						posts: quote._id
					}
				}
			).session(session);
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
export const repeatPost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
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
			const postToDelete = await Post.findOne(payload);
			if (postToDelete) {
				await Post.findByIdAndDelete(postToDelete._id).session(session);
			}
			const repeated = await new Post(payload).save({ session });
			await User.findOneAndUpdate(
				{
					_id: userId
				},
				{
					...(postToDelete
						? {
								$pull: {
									posts: null
								}
							}
						: {}),
					$addToSet: {
						posts: repeated._id
					}
				}
			).session(session);
			if (!postToDelete) {
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
export const unrepeatPost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const unrepeated = await Post.findOneAndDelete({
				author: userId,
				repeatPost: postId
			}).session(session);
			if (unrepeated) {
				await User.findOneAndUpdate(
					{
						_id: userId
					},
					{
						$pull: {
							posts: unrepeated._id
						}
					}
				).session(session);
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
export const replyToPost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const { content = "", poll, "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = (req.userInfo as UserInfo).userId;
	try {
		validateContent(content, poll, media);
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
								fileType: media.type,
								src: (await uploadFile(media)).secure_url,
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
			const replyPost = await new Post(model).save({ session });
			await User.findOneAndUpdate(
				{
					_id: userId
				},
				{
					$addToSet: {
						posts: replyPost._id
					}
				}
			).session(session);
			await Post.findByIdAndUpdate(originalPostId, {
				$inc: {
					score: replyScore
				}
			}).session(session);
			res.status(201).json({ reply: replyPost });
		});
	} finally {
		await session.endSession();
	}
};
export const castVote: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const option = req.query.option as string;
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const post = await findPostById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		const poll = post.attachments?.poll as HydratedDocument<PollModel> & Dictionary;
		if (!poll) {
			res.status(422).send("Post does not include a poll");
			return;
		}
		const isOptionNota = option === "nota";
		if (!(isOptionNota || poll[option])) {
			res.status(422).send("Poll does not include the specified option");
			return;
		}
		if (post.author.toString() === userId) {
			res.status(403).send("User cannot vote on their own poll");
			return;
		}
		const pollExpiryDate = (post as Dictionary).createdAt;
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
export const deletePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const post = await Post.findById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	if (post.author.toString() !== userId) {
		res.status(403).send("You are not allowed to perform this action");
		return;
	}
	await deletePostWithCascade(post);
	res.status(200).json({ deleted: post });
};