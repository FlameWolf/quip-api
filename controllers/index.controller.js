"use strict";

const timelineAggregationPipeline = require("../aggregations/timeline");
const User = require("../models/user.model");
const Post = require("../models/post.model");

const home = async (req, res, next) => {
	res.status(200).end();
};
const timeline = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const lastPostId = req.query.lastPostId;
	try {
		const posts = await Post.aggregate(timelineAggregationPipeline(userId, lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		res.status(500).send(err);
	}
};
const timelineTop = async (req, res, next) => {
	res.status(200).end();
};

module.exports = { home, timeline, timelineTop };