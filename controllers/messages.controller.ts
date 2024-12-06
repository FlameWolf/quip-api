"use strict";

import { ObjectId } from "bson";
import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import * as cld from "cld";
import { v2 as cloudinary } from "cloudinary";
import { maxMessageLength, getUnicodeClusterCount } from "../library";
import messageAggregationPipeline from "../db/pipelines/message";
import * as postsController from "./posts.controller";
import Message from "../models/message.model";
import User from "../models/user.model";
import { RequestHandler } from "express";

type MessageModel = InferSchemaType<typeof Message.schema>;
type AttachmentsModel = Required<MessageModel>["attachments"];
type MediaFileModel = (AttachmentsModel & Dictionary)["mediaFile"];
type LanguageEntry = InferArrayElementType<MessageModel["languages"]>;
type MentionEntry = InferArrayElementType<MessageModel["mentions"]>;
type HashtagEntry = InferArrayElementType<MessageModel["hashtags"]>;

export const findMessageById = async (messageId: string | ObjectId): Promise<HydratedDocument<MessageModel>> => {
	return (await Message.findById(messageId)) as HydratedDocument<MessageModel>;
};
export const validateContent = (content: string, media?: MulterFile, postId?: string | ObjectId) => {
	if (!content.trim()) {
		if (!media && !postId) {
			throw new Error("No content");
		}
	}
	if (getUnicodeClusterCount(content) > maxMessageLength) {
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
export const updateLanguages = async (message: Partial<MessageModel> | DeepPartial<MessageModel>) => {
	const languages = new Set(message.languages);
	const promises = [];
	const { content, attachments } = message;
	promises.push(content && (await detectLanguages(content)));
	if (attachments) {
		const { mediaFile } = attachments;
		if (mediaFile) {
			const mediaDescription = (mediaFile as MediaFileModel).description as string;
			promises.push(mediaDescription && (await detectLanguages(mediaDescription)));
		}
	}
	for (const language of (await Promise.all(promises)).flat()) {
		if (language) {
			languages.add(language as LanguageEntry);
		}
	}
	message.languages = [...languages];
};
export const updateMentionsAndHashtags = async (content: string, message: Partial<MessageModel> | DeepPartial<MessageModel>) => {
	const messageMentions = new Set(message.mentions?.map(mention => mention?.toString()));
	const messageHashtags = new Set(message.hashtags);
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
		users.map(user => user._id).forEach(userId => messageMentions.add(userId.toString()));
	}
	if (contentHashtags) {
		contentHashtags.map(hashtag => hashtag.substring(1)).forEach(hashtag => messageHashtags.add(hashtag as HashtagEntry));
	}
	message.mentions = messageMentions.size > 0 ? [...messageMentions].map(mention => new ObjectId(mention) as MentionEntry) : undefined;
	message.hashtags = messageHashtags.size > 0 ? [...messageHashtags] : undefined;
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
export const deleteMessageWithCascade = async (message: HydratedDocument<MessageModel>) => {
	const session = await mongoose.startSession();
	await session.withTransaction(async () => {
		await Message.deleteOne(message as MessageModel).session(session);
		await Promise.all([
			User.findOneAndUpdate(
				{
					_id: message.author
				},
				{
					$pull: {
						messages: message._id
					}
				}
			).session(session)
		]);
	});
	await session.endSession();
};
export const createMessage: RequestHandler = async (req, res, next) => {
	const { content = "", "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = (req.userInfo as UserInfo).userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	const model = {
		content,
		author: userId,
		...(media && {
			attachments: {
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
		const message = await new Message(model).save({ session });
		await User.findOneAndUpdate(
			{
				_id: userId
			},
			{
				$addToSet: {
					messages: message._id
				}
			}
		).session(session);
		res.status(201).send({ message });
	});
	await session.endSession();
};
export const getMessage: RequestHandler = async (req, res, next) => {
	const messageId = req.params.messageId;
	const originalMessage = await findMessageById(messageId);
	if (!originalMessage) {
		res.status(404).send("Message not found");
		return;
	}
	const message = (
		await Message.aggregate([
			{
				$match: {
					_id: new ObjectId(originalMessage._id)
				}
			},
			...messageAggregationPipeline
		])
	).shift();
	res.status(200).json({ message });
};
export const quotePost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const { content = "", "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = (req.userInfo as UserInfo).userId;
	try {
		validateContent(content, media, postId);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	const session = await mongoose.startSession();
	try {
		const post = await postsController.findPostById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		await session.withTransaction(async () => {
			const postId = post._id;
			const model = {
				content,
				author: userId,
				attachments: {
					...(media && {
						mediaFile: {
							fileType: media.type,
							src: (await uploadFile(media)).secure_url,
							description: mediaDescription
						}
					}),
					post: postId
				},
				languages: post.languages,
				...(location && {
					location: JSON.parse(location)
				}),
				mentions: [post.author]
			};
			await Promise.all([updateLanguages(model), content.trim() && updateMentionsAndHashtags(content, model)]);
			const quote = await new Message(model).save({ session });
			await User.findOneAndUpdate(
				{
					_id: userId
				},
				{
					$addToSet: {
						messages: quote._id
					}
				}
			).session(session);
			res.status(201).json({ quote });
		});
	} finally {
		await session.endSession();
	}
};
export const deleteMessage: RequestHandler = async (req, res, next) => {
	const messageId = req.params.messageId;
	const userId = (req.userInfo as UserInfo).userId;
	const message = await Message.findById(messageId);
	if (!message) {
		res.status(404).send("Message not found");
		return;
	}
	if (message.author.toString() !== userId) {
		res.status(403).send("You are not allowed to perform this action");
		return;
	}
	await deleteMessageWithCascade(message);
	res.status(200).json({ deleted: message });
};