"use strict";

import { ObjectId } from "mongodb";
import mongoose, { InferSchemaType, HydratedDocument } from "mongoose";
import * as bcrypt from "bcrypt";
import { noReplyEmail, emailTemplates, passwordRegExp, rounds } from "../library";
import timelineAggregationPipeline from "../db/pipelines/timeline";
import activityAggregationPipeline from "../db/pipelines/activity";
import topmostAggregationPipeline from "../db/pipelines/topmost";
import hashtagAggregationPipeline from "../db/pipelines/hashtag";
import * as emailController from "./email.controller";
import User from "../models/user.model";
import Post from "../models/post.model";
import EmailVerification from "../models/email-verification.model";
import PasswordReset from "../models/password-reset.model";
import { RequestHandler } from "express";

type UserModel = InferSchemaType<typeof User.schema>;
type EmailVerificationModel = InferSchemaType<typeof EmailVerification.schema>;
type PasswordResetModel = InferSchemaType<typeof PasswordReset.schema>;

export const timeline: RequestHandler = async (req, res, next) => {
	const { includeRepeats, includeReplies, lastPostId } = req.query as Dictionary<string>;
	const userId = (req.userInfo as UserInfo).userId;
	const posts = await User.aggregate(timelineAggregationPipeline(userId, includeRepeats !== "false", includeReplies !== "false", lastPostId));
	res.status(200).json({ posts });
};
export const activity: RequestHandler = async (req, res, next) => {
	const period = req.params.period;
	const lastEntryId = req.query.lastEntryId;
	const userId = (req.userInfo as UserInfo).userId;
	const entries = await User.aggregate(activityAggregationPipeline(userId, period, lastEntryId as string));
	res.status(200).json({ entries });
};
export const topmost: RequestHandler = async (req, res, next) => {
	const period = req.params.period;
	const { lastScore, lastPostId } = req.query as Dictionary<string>;
	const posts = await Post.aggregate(topmostAggregationPipeline((req.userInfo as UserInfo)?.userId, period, lastScore, lastPostId));
	res.status(200).json({ posts });
};
export const hashtag: RequestHandler = async (req, res, next) => {
	const tagName = req.params.name;
	const { sortBy, lastScore, lastPostId } = req.query as Dictionary<string>;
	const posts = await Post.aggregate(hashtagAggregationPipeline(tagName, (req.userInfo as UserInfo)?.userId, sortBy, lastScore, lastPostId));
	res.status(200).json({ posts });
};
export const rejectEmail: RequestHandler = async (req, res, next) => {
	const token = req.params.token;
	const session = await mongoose.startSession();
	try {
		const emailVerification = await EmailVerification.findOne({ token });
		if (!emailVerification) {
			res.status(404).send("Verification token not found or expired");
			return;
		}
		await session.withTransaction(async () => {
			const previousEmail = emailVerification.previousEmail;
			const user = (await User.findByIdAndUpdate(emailVerification.user, { email: emailVerification.previousEmail }).session(session)) as UserModel;
			await EmailVerification.deleteOne(emailVerification as EmailVerificationModel).session(session);
			res.status(200).send();
			if (previousEmail) {
				emailController.sendEmail(noReplyEmail, previousEmail, "Email address change rejected", emailTemplates.notifications.emailRejected(user.handle, emailVerification.email as string));
			}
		});
	} finally {
		await session.endSession();
	}
};
export const verifyEmail: RequestHandler = async (req, res, next) => {
	const token = req.params.token;
	const emailVerification = await EmailVerification.findOne({ token });
	if (!emailVerification) {
		res.status(404).send("Verification token not found or expired");
		return;
	}
	const email = emailVerification.email as string;
	const user = (await User.findByIdAndUpdate(emailVerification.user, { email })) as HydratedDocument<UserModel>;
	res.status(200).send();
	emailController.sendEmail(noReplyEmail, email, "Email address change verified", emailTemplates.notifications.emailVerified(user.handle, email));
};
export const forgotPassword: RequestHandler = async (req, res, next) => {
	const { handle, email } = req.body;
	const user = await User.findOne({ handle, deleted: false }).select("+email");
	if (!user) {
		res.status(400).send("User not found");
		return;
	}
	if (user.email !== email) {
		res.status(403).send("Email address is incorrect or unverified");
		return;
	}
	const passwordReset = await new PasswordReset({
		user: user._id,
		token: new ObjectId()
	}).save();
	res.status(200).json({ passwordReset });
	emailController.sendEmail(noReplyEmail, email, "Reset password", emailTemplates.actions.resetPassword(handle, `${process.env.ALLOW_ORIGIN}/reset-password/${passwordReset.token}`));
};
export const resetPassword: RequestHandler = async (req, res, next) => {
	const token = req.params.token;
	const password = req.body.password;
	const session = await mongoose.startSession();
	try {
		const passwordReset = await PasswordReset.findOne({ token });
		if (!passwordReset) {
			res.status(404).send("Reset token not found or expired");
			return;
		}
		if (!(password && passwordRegExp.test(password))) {
			res.status(400).send("Invalid password");
			return;
		}
		await session.withTransaction(async () => {
			const passwordHash = bcrypt.hashSync(password, rounds);
			const user = (await User.findByIdAndUpdate(passwordReset.user, { password: passwordHash }).select("+email").session(session)) as UserModel;
			await PasswordReset.deleteOne(passwordReset as PasswordResetModel).session(session);
			res.status(200).send();
			emailController.sendEmail(noReplyEmail, user.email as string, "Password reset", emailTemplates.notifications.passwordReset(user.handle));
		});
	} finally {
		await session.endSession();
	}
};