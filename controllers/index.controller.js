"use strict";

const timelineAggregationPipeline = require("../db/pipelines/timeline");
const topmostAggregationPipeline = require("../db/pipelines/topmost");
const User = require("../models/user.model");
const Post = require("../models/post.model");

const timeline = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const lastPostId = req.query.lastPostId;
	try {
		const posts = await User.aggregate(timelineAggregationPipeline(userId, lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		res.status(500).send(err);
	}
};
const topmost = async (req, res, next) => {
	const userId = req.userInfo?.userId;
	const period = req.params.period;
	const lastPostId = req.query.lastPostId;
	try {
		const posts = await Post.aggregate(topmostAggregationPipeline(userId, period, lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports = { timeline, topmost };