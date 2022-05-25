"use strict";

const searchPostsAggregationPipeline = require("../db/pipelines/search-posts");
const nearbyPostsAggregationPipeline = require("../db/pipelines/nearby-posts");
const Post = require("../models/post.model");

const searchPosts = async (req, res, next) => {
	const { q: searchText, from, since, until, "has-media": hasMedia, "not-from": notFrom, "sort-by": sortBy, "date-order": dateOrder, lastScore, lastPostId } = req.query;
	const userId = req.userInfo?.userId;
	if (!searchText) {
		res.status(400).send("Search text missing");
		return;
	}
	try {
		const posts = await Post.aggregate(
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
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
	}
};
const nearbyPosts = async (req, res, next) => {
	const { long: longitude, lat: latitude, "max-dist": maxDistance, lastDistance, lastPostId } = req.query;
	const userId = req.userInfo?.userId;
	try {
		const posts = await Post.aggregate(nearbyPostsAggregationPipeline([longitude, latitude], maxDistance, userId, lastDistance, lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
	}
};

module.exports = { searchPosts, nearbyPosts };