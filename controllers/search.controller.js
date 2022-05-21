"use strict";

const searchPostsAggregationPipeline = require("../db/pipelines/search-posts");
const Post = require("../models/post.model");

const searchPosts = async (req, res, next) => {
	const { q: searchText, from, since, until, "has-media": hasMedia, "not-from": notFrom, "sort-by": sortBy, "date-order": dateOrder, lastScore, lastPostId } = req.query;
	const userId = req.userInfo?.userId;
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
				sortBy,
				dateOrder,
				lastScore,
				lastPostId
			)
		);
		res.status(200).json({ result });
	} catch (err) {
		next(err);
	}
};

module.exports = { searchPosts };