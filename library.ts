"use strict";

import { ObjectId } from "bson";
import * as cld from "cld";
import { v2 as cloudinary } from "cloudinary";
import Post from "./models/post.model";
import Message from "./models/message.model";
import User from "./models/user.model";
import { InferSchemaType } from "mongoose";

type ContentModel = InferSchemaType<typeof Post.schema> | InferSchemaType<typeof Message.schema>;
export type UserModel = InferSchemaType<typeof User.schema>;
export type MentionEntry = InferArrayElementType<ContentModel["mentions"]>;
export type HashtagEntry = InferArrayElementType<ContentModel["hashtags"]>;

export const invalidHandles = ["auth", "home", "search", "user", "users", "post", "posts", "quip", "quips", "favourite", "favourites", "unfavourite", "repeat", "repeats", "unrepeat", "reply", "replies", "profile", "profiles", "setting", "settings", "follow", "followed", "follows", "following", "follower", "followers", "unfollow", "mute", "muted", "unmute", "block", "blocked", "unblock", "filter", "filters", "list", "lists", "bookmark", "bookmarks", "unbookmark", "hashtag", "hashtags", "notification", "notifications", "message", "messages", "account", "accounts", "security", "privacy", "admin"];
export const handleRegExp = /^[A-Za-z][\w]{3,31}$/;
export const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
export const urlRegExp = /^(\w+[~@#$\-_+]?\w+:\/\/)((\w)+[\-\._~:\/\?#\[\]@!$&'\(\)\*+,;=%]?)+$/;
export const emailRegExp = /^[\w\.-]+@[\w\.-]+\.\w+$/;
export const fileExtensionRegExp = /\.[^\.]*$/;
export const rounds = 10;
export const authTokenLife = 1000 * 60 * 5;
export const maxContentLength = 256;
export const maxMessageLength = 65536;
export const maxPollOptionLength = 32;
export const maxMutedWordLength = 256;
export const minPollDuration = 1000 * 60 * 30;
export const maxPollDuration = 1000 * 60 * 60 * 24 * 7;
export const batchSize = 65536;
export const validMimeTypes = ["image", "video"];
export const favouriteScore = 1;
export const quoteScore = 2;
export const replyScore = 2;
export const voteScore = 2;
export const repeatScore = 4;
export const nullId = "000000000000000000000000";
export const megaByte = 1024 * 1024;
export const maxCacheSize = 10000;
export const maxRowsPerFetch = 20;
export const noReplyEmail = "no-reply@quip-web-app.web.app";
export const emailTemplates = {
	actions: {
		rejectEmail: (handle: string, email: string, url: string) => `Hi @<strong>${handle}</strong>, your email address on Quip was changed to <strong>${email}</strong> recently. Click <a target="_blank" href="${url}">here</a> to reject this change if it was not initiated by you.<br/><br/><em>Link valid for only 7 days.</em>`,
		verifyEmail: (handle: string, email: string, url: string) => `Hi @<strong>${handle}</strong>, your email address on Quip was changed to <strong>${email}</strong> recently. Click <a target="_blank" href="${url}">here</a> to verify that this is your email address.<br/><br/><em>Link valid for only 7 days.</em>`,
		resetPassword: (handle: string, url: string) => `Hi @<strong>${handle}</strong>, a password reset request was raised for your Quip account. Click <a target="_blank" href="${url}">here</a> to reset your password.<br/><br/><em>This link will be valid for only 7 days.</em>`
	},
	notifications: {
		emailRejected: (handle: string, email: string) => `Hi @<strong>${handle}</strong>, your email address change to <strong>${email}</strong> on Quip was rejected.`,
		emailVerified: (handle: string, email: string) => `Hi @<strong>${handle}</strong>, your email address <strong>${email}</strong> on Quip has been verified.`,
		passwordChanged: (handle: string) => `Hi @<strong>${handle}</strong>, your sign in password on Quip was changed.`,
		passwordReset: (handle: string) => `Hi @<strong>${handle}</strong>, your sign in password on Quip was reset.`,
		deactivated: (handle: string) => `Hi @<strong>${handle}</strong>, your Quip account was deactivated.`,
		activated: (handle: string) => `Hi @<strong>${handle}</strong>, your Quip account was activated.`,
		deleted: (handle: string) => `Hi @<strong>${handle}</strong>, your Quip account was deleted. Goodbye!`
	}
};

export const setProperty = (operand: Dictionary, path: string | Array<string>, value: any) => {
	const segments = Array.isArray(path) ? path : path.split(".");
	operand = operand || {};
	if (segments.length > 1) {
		const segment = segments.shift() as string;
		operand[segment] = operand[segment] || {};
		setProperty(operand[segment], segments, value);
	} else {
		operand[segments.pop() as string] = value;
	}
};
export const getProperty = (operand: Dictionary, path: string | Array<string>): any => {
	const segments = Array.isArray(path) ? path : path.split(".");
	if (operand && segments.length) {
		return getProperty(operand[segments.shift() as string], segments);
	}
	return operand;
};
export const getUnicodeClusterCount = (value: string) => Array.from(new Intl.Segmenter().segment(value)).length;
export const escapeRegExp = (value: string) => value.replace(/[\/.*+?|[()\]{}\$^-]/g, (match: string) => `\\${match}`);
export const sanitiseFileName = (value: string, maxLength?: number) =>
	value
		.trim()
		.substring(0, maxLength)
		.replace(/[^\p{L}\p{M}\d]/gu, "_");
export const standardiseFileName = (name: string) => `${sanitiseFileName(name.replace(fileExtensionRegExp, ""), 16)}_${Date.now().valueOf()}${name.match(fileExtensionRegExp)?.[0]}`;
export const detectLanguages = async (value: string) => {
	if (value.trim()) {
		try {
			return (await cld.detect(value)).languages.map(language => language.code);
		} finally {
		}
	}
	return ["xx"];
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
export const updateMentionsAndHashtags = async (content: string, post: Partial<ContentModel> | DeepPartial<ContentModel>) => {
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