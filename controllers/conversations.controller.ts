"use strict";

import { ObjectId } from "bson";
import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import * as cld from "cld";
import { v2 as cloudinary } from "cloudinary";
import { maxMessageLength, getUnicodeClusterCount } from "../library";
import messageAggregationPipeline from "../db/pipelines/message";
import * as postsController from "./posts.controller";
import User from "../models/user.model";
import Message from "../models/message.model";
import { RequestHandler } from "express";

type UserModel = InferSchemaType<typeof User.schema>;
type MessageModel = InferSchemaType<typeof Message.schema>;
type AttachmentsModel = Required<MessageModel>["attachments"];
type MediaFileModel = (AttachmentsModel & Dictionary)["mediaFile"];
type LanguageEntry = InferArrayElementType<MessageModel["languages"]>;
type MentionEntry = InferArrayElementType<MessageModel["mentions"]>;
type HashtagEntry = InferArrayElementType<MessageModel["hashtags"]>;

export const createConversation: RequestHandler = async (req, res, next) => {};
export const addParticipant: RequestHandler = async (req, res, next) => {};
export const addMessage: RequestHandler = async (req, res, next) => {};
export const leaveConversation: RequestHandler = async (req, res, next) => {};