"use strict";

const Post = require("../models/post.model");
const searchPostsAggregationPipeline = require("../db/pipelines/search-posts");

const searchPosts = async (req, res, next) => {
	const { q: searchText, from, since, until, "has-media": hasMedia, "not-from": notFrom, "date-sort": sortByDate, lastPostId } = req.query;
	const userId = req.userInfo.userId;
	if (!searchText) {
		res.status(400).send("Search text missing");
		return;
	}
	try {
		const result = await Post.aggregate(
			searchPostsAggregationPipeline(
				searchText,
				userId,
				{
					from,
					since,
					until,
					hasMedia,
					notFrom
				},
				sortByDate,
				lastPostId
			)
		);
		res.status(200).json({ result });
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports = { searchPosts };