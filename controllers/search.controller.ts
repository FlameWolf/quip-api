"use strict";

import searchPostsAggregationPipeline from "../db/pipelines/search-posts";
import nearbyPostsAggregationPipeline from "../db/pipelines/nearby-posts";
import searchUsersAggregationPipeline from "../db/pipelines/search-users";
import Post from "../models/post.model";
import User from "../models/user.model";
import { RequestHandler } from "express";

export const searchPosts: RequestHandler = async (req, res, next) => {
	const { q: searchText, from, since, until, "has-media": hasMedia, "not-from": notFrom, "sort-by": sortBy, "date-order": dateOrder, replies, langs: languages, "langs-match": includeLanguages, "media-desc": mediaDescription, lastScore, lastPostId } = req.query as Dictionary<string>;
	const posts = await Post.aggregate(
		searchPostsAggregationPipeline(
			searchText?.trim(),
			{
				from,
				since,
				until,
				hasMedia,
				notFrom,
				replies,
				languages,
				includeLanguages,
				mediaDescription
			},
			sortBy,
			dateOrder,
			(req.userInfo as UserInfo)?.userId,
			lastScore,
			lastPostId
		)
	);
	res.status(200).json({ posts });
};
export const nearbyPosts: RequestHandler = async (req, res, next) => {
	const { long: longitude, lat: latitude, "max-dist": maxDistance, lastDistance, lastPostId } = req.query as Dictionary<string>;
	const posts = await Post.aggregate(nearbyPostsAggregationPipeline([longitude, latitude], maxDistance, (req.userInfo as UserInfo)?.userId, lastDistance, lastPostId));
	res.status(200).json({ posts });
};
export const searchUsers: RequestHandler = async (req, res, next) => {
	const { q: searchText, match, "date-order": dateOrder, lastUserId } = req.query as Dictionary<string>;
	if (!searchText) {
		res.status(400).send("Search text missing");
		return;
	}
	const users = await User.aggregate(searchUsersAggregationPipeline(searchText, match, dateOrder, (req.userInfo as UserInfo)?.userId, lastUserId));
	res.status(200).json({ users });
};