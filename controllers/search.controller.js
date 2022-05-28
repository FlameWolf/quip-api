"use strict";

const searchPostsAggregationPipeline = require("../db/pipelines/search-posts");
const nearbyPostsAggregationPipeline = require("../db/pipelines/nearby-posts");
const searchUsersAggregationPipeline = require("../db/pipelines/search-users");
const Post = require("../models/post.model");
const User = require("../models/user.model");

const searchPosts = async (req, res, next) => {
	const { q: searchText, from, since, until, "has-media": hasMedia, "not-from": notFrom, "sort-by": sortBy, "date-order": dateOrder, lastScore, lastPostId } = req.query;
	if (!searchText) {
		res.status(400).send("Search text missing");
		return;
	}
	try {
		const posts = await Post.aggregate(
			searchPostsAggregationPipeline(
				searchText,
				{
					from,
					since,
					until,
					hasMedia,
					notFrom
				},
				sortBy,
				dateOrder,
				req.userInfo?.userId,
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
	try {
		const posts = await Post.aggregate(nearbyPostsAggregationPipeline([longitude, latitude], maxDistance, req.userInfo?.userId, lastDistance, lastPostId));
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
	}
};
const searchUsers = async (req, res, next) => {
	const { q: searchText, match, "date-order": dateOrder, lastUserId } = req.query;
	if (!searchText) {
		res.status(400).send("Search text missing");
		return;
	}
	try {
		const users = await User.aggregate(searchUsersAggregationPipeline(searchText, match, dateOrder, req.userInfo?.userId, lastUserId));
		res.status(200).json({ users });
	} catch (err) {
		next(err);
	}
};

module.exports = {
	searchPosts,
	nearbyPosts,
	searchUsers
};