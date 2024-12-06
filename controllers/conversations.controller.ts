"use strict";

import { ObjectId } from "bson";
import mongoose, { InferSchemaType, HydratedDocument } from "mongoose";
import * as cld from "cld";
import { v2 as cloudinary } from "cloudinary";
import { getUnicodeClusterCount, maxMessageLength } from "../library";
import messageAggregationPipeline from "../db/pipelines/message";
import * as postsController from "./posts.controller";
import User from "../models/user.model";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { RequestHandler } from "express";

type ConversationModel = InferSchemaType<typeof Conversation.schema>;
type MessageModel = InferSchemaType<typeof Message.schema>;
type AttachmentsModel = Required<MessageModel>["attachments"];
type MediaFileModel = (AttachmentsModel & Dictionary)["mediaFile"];
type LanguageEntry = InferArrayElementType<MessageModel["languages"]>;
type MentionEntry = InferArrayElementType<MessageModel["mentions"]>;
type HashtagEntry = InferArrayElementType<MessageModel["hashtags"]>;

export const findConversationById = async (conversationId: string | ObjectId): Promise<HydratedDocument<ConversationModel>> => {
	return (await Message.findById(conversationId)) as HydratedDocument<ConversationModel>;
};
export const createConversation: RequestHandler = async (req, res, next) => {};
export const addParticipant: RequestHandler = async (req, res, next) => {};
export const addMessage: RequestHandler = async (req, res, next) => {};
export const leaveConversation: RequestHandler = async (req, res, next) => {};