"use strict";

const timelineAggregationPipeline = require("../db/pipelines/timeline");
const activityAggregationPipeline = require("../db/pipelines/activity");
const topmostAggregationPipeline = require("../db/pipelines/topmost");
const User = require("../models/user.model");
const Post = require("../models/post.model");

const timeline = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const { includeRepeats, includeReplies, lastPostId } = req.query;
	try {
		const posts = await User.aggregate(timelineAggregationPipeline(userId, includeRepeats !== "false", includeReplies !== "false", lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
	}
};
const activity = async (req, res, next) => {
	const userId = req.userInfo?.userId;
	const period = req.params.period;
	const lastPostId = req.query.lastPostId;
	try {
		const entries = await User.aggregate(activityAggregationPipeline(userId, period, lastPostId));
		res.status(200).json({ entries });
	} catch (err) {
		next(err);
	}
};
const topmost = async (req, res, next) => {
	const userId = req.userInfo?.userId;
	const period = req.params.period;
	try {
		const posts = await Post.aggregate(topmostAggregationPipeline(userId, period));
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
	}
};

module.exports = {
	timeline,
	activity,
	topmost
};