"use strict";

const mongoose = require("mongoose");
const timelineAggregationPipeline = require("../db/pipelines/timeline");
const activityAggregationPipeline = require("../db/pipelines/activity");
const topmostAggregationPipeline = require("../db/pipelines/topmost");
const emailController = require("./email.controller");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const EmailVerification = require("../models/email-verification.model");

const timeline = async (req, res, next) => {
	const { includeRepeats, includeReplies, lastPostId } = req.query;
	const userId = req.userInfo.userId;
	try {
		const posts = await User.aggregate(timelineAggregationPipeline(userId, includeRepeats !== "false", includeReplies !== "false", lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
	}
};
const activity = async (req, res, next) => {
	const period = req.params.period;
	const lastPostId = req.query.lastPostId;
	const userId = req.userInfo?.userId;
	try {
		const entries = await User.aggregate(activityAggregationPipeline(userId, period, lastPostId));
		res.status(200).json({ entries });
	} catch (err) {
		next(err);
	}
};
const topmost = async (req, res, next) => {
	const period = req.params.period;
	const { lastScore, lastPostId } = req.query;
	const userId = req.userInfo?.userId;
	try {
		const posts = await Post.aggregate(topmostAggregationPipeline(userId, period, lastScore, lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
	}
};
const verifyEmail = async (req, res, next) => {
	const token = req.params.token;
	const session = await mongoose.startSession();
	try {
		const emailVerification = await EmailVerification.findOne({ token });
		if (!emailVerification) {
			res.status(404).send("Verification token not found or expired");
			return;
		}
		await session.withTransaction(async () => {
			await User.findByIdAndUpdate(emailVerification.user, { emailVerified: true }).session(session);
			await EmailVerification.deleteOne(emailVerification).session(session);
			res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><p>Email verified successfully.</p></body></html>`);
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};

module.exports = {
	timeline,
	activity,
	topmost,
	verifyEmail
};