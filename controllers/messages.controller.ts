"use strict";

import { ObjectId } from "bson";
import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import { getUnicodeClusterCount, maxMessageLength, detectLanguages, uploadFile, updateMentionsAndHashtags } from "../library";
import messageAggregationPipeline from "../db/pipelines/message";
import * as conversationsController from "./conversations.controller";
import * as postsController from "./posts.controller";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { RequestHandler } from "express";

type MessageModel = InferSchemaType<typeof Message.schema>;
type AttachmentsModel = Required<MessageModel>["attachments"];
type MediaFileModel = (AttachmentsModel & Dictionary)["mediaFile"];
type LanguageEntry = InferArrayElementType<MessageModel["languages"]>;

const validateContent = (content: string, media?: MulterFile, postId?: string | ObjectId) => {
	if (!content.trim()) {
		if (!media && !postId) {
			throw new Error("No content");
		}
	}
	if (getUnicodeClusterCount(content) > maxMessageLength) {
		throw new Error("Content too long");
	}
};
const updateLanguages = async (message: Partial<MessageModel> | DeepPartial<MessageModel>) => {
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
const findMessageById = async (messageId: string | ObjectId): Promise<HydratedDocument<MessageModel>> => {
	return (await Message.findById(messageId)) as HydratedDocument<MessageModel>;
};
export const createMessage: RequestHandler = async (req, res, next) => {
	const { conversation, content = "", "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = (req.userInfo as UserInfo).userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	if (!(await conversationsController.findConversationById(conversation))) {
		res.status(404).send("Conversation not found");
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
		await Conversation.findOneAndUpdate(
			{
				_id: conversation
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
	const { conversation, content = "", "media-description": mediaDescription, location } = req.body;
	const media = req.file;
	const userId = (req.userInfo as UserInfo).userId;
	try {
		validateContent(content, media, postId);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	if (!(await conversationsController.findConversationById(conversation))) {
		res.status(404).send("Conversation not found");
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
			await Conversation.findOneAndUpdate(
				{
					_id: conversation
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
	const conversationId = message.conversation;
	const conversation = await Conversation.findOne({
		id: conversationId,
		participants: userId
	});
	if (!conversation) {
		res.status(403).send("You are not allowed to perform this action");
		return;
	}
	await Conversation.updateOne(conversation, {
		$addToSet: {
			deletedFor: userId
		}
	});
	res.status(200).json({ deleted: message });
};