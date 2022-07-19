"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { noReplyEmail, emailTemplates, passwordRegExp, rounds } = require("../library");
const timelineAggregationPipeline = require("../db/pipelines/timeline");
const activityAggregationPipeline = require("../db/pipelines/activity");
const topmostAggregationPipeline = require("../db/pipelines/topmost");
const hashtagAggregationPipeline = require("../db/pipelines/hashtag");
const emailController = require("./email.controller");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const EmailVerification = require("../models/email-verification.model");
const PasswordReset = require("../models/password-reset.model");

const timeline = async (req, res, next) => {
	const { includeRepeats, includeReplies, lastPostId } = req.query;
	const userId = req.userInfo.userId;
	const posts = await User.aggregate(timelineAggregationPipeline(userId, includeRepeats !== "false", includeReplies !== "false", lastPostId));
	res.status(200).json({ posts });
};
const activity = async (req, res, next) => {
	const period = req.params.period;
	const lastEntryId = req.query.lastEntryId;
	const userId = req.userInfo.userId;
	const entries = await User.aggregate(activityAggregationPipeline(userId, period, lastEntryId));
	res.status(200).json({ entries });
};
const topmost = async (req, res, next) => {
	const period = req.params.period;
	const { lastScore, lastPostId } = req.query;
	const posts = await Post.aggregate(topmostAggregationPipeline(req.userInfo?.userId, period, lastScore, lastPostId));
	res.status(200).json({ posts });
};
const hashtag = async (req, res, next) => {
	const tagName = req.params.name;
	const { sortBy, lastScore, lastPostId } = req.query;
	const posts = await Post.aggregate(hashtagAggregationPipeline(tagName, req.userInfo?.userId, sortBy, lastScore, lastPostId));
	res.status(200).json({ posts });
};
const rejectEmail = async (req, res, next) => {
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
			const user = await User.findByIdAndUpdate(emailVerification.user, { email: emailVerification.previousEmail }).session(session);
			await EmailVerification.deleteOne(emailVerification).session(session);
			res.status(200).send();
			if (previousEmail) {
				emailController.sendEmail(noReplyEmail, previousEmail, "Email address change rejected", emailTemplates.notifications.emailRejected(user.handle, emailVerification.email));
			}
		});
	} finally {
		await session.endSession();
	}
};
const verifyEmail = async (req, res, next) => {
	const token = req.params.token;
	const emailVerification = await EmailVerification.findOne({ token });
	if (!emailVerification) {
		res.status(404).send("Verification token not found or expired");
		return;
	}
	const email = emailVerification.email;
	const user = await User.findByIdAndUpdate(emailVerification.user, { email });
	res.status(200).send();
	emailController.sendEmail(noReplyEmail, email, "Email address change verified", emailTemplates.notifications.emailVerified(user.handle, email));
};
const forgotPassword = async (req, res, next) => {
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
const resetPassword = async (req, res, next) => {
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
			const passwordHash = await bcrypt.hash(password, rounds);
			const user = await User.findByIdAndUpdate(passwordReset.user, { password: passwordHash }).select("+email").session(session);
			await PasswordReset.deleteOne(passwordReset).session(session);
			res.status(200).send();
			emailController.sendEmail(noReplyEmail, user.email, "Password reset", emailTemplates.notifications.passwordReset(user.handle));
		});
	} finally {
		await session.endSession();
	}
};

module.exports = {
	timeline,
	activity,
	topmost,
	hashtag,
	rejectEmail,
	verifyEmail,
	forgotPassword,
	resetPassword
};