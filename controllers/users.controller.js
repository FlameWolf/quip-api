"use strict";

const userPostsAggregationPipeline = require("../db/pipelines/user-posts");
const favouritesAggregationPipeline = require("../db/pipelines/favourites");
const followingAggregationPipeline = require("../db/pipelines/following");
const followersAggregationPipeline = require("../db/pipelines/followers");
const mentionsAggregationPipeline = require("../db/pipelines/mentions");
const User = require("../models/user.model");
const Follow = require("../models/follow.model");
const Mention = require("../models/mention.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, deactivated: false, deleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, deactivated: false, deleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, deleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, deleted: false });
const findPostsByUserId = async (userId, includeRepeats, includeReplies, lastPostId) => await User.aggregate(userPostsAggregationPipeline(userId, includeRepeats, includeReplies, lastPostId));
const findFavouritesByUserId = async (userId, lastFavouriteId) => await User.aggregate(favouritesAggregationPipeline(userId, lastFavouriteId));
const findFollowingByUserId = async (userId, lastFollowId) => await Follow.aggregate(followingAggregationPipeline(userId, lastFollowId));
const findFollowersByUserId = async (userId, lastFollowId) => await Follow.aggregate(followersAggregationPipeline(userId, lastFollowId));
const findMentionsByUserId = async (userId, lastMentionId) => await Mention.aggregate(mentionsAggregationPipeline(userId, lastMentionId));
const getUser = async (req, res, next) => {
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		res.status(200).json({ user });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getUserPosts = async (req, res, next) => {
	const handle = req.params.handle;
	const { includeRepeats, includeReplies, lastPostId } = req.query;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		const posts = await findPostsByUserId(user._id, includeRepeats === "true", includeReplies === "true", lastPostId);
		res.status(200).json({ posts });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getUserFavourites = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFavouriteId = req.query.lastFavouriteId;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		const favourites = await findFavouritesByUserId(user._id, lastFavouriteId);
		res.status(200).json({ favourites });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getUserFollowing = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFollowId = req.query.lastFollowId;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		const following = await findFollowingByUserId(user._id, lastFollowId);
		res.status(200).json({ following });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getUserFollowers = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFollowId = req.query.lastFollowId;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		const followers = await findFollowersByUserId(user._id, lastFollowId);
		res.status(200).json({ followers });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getUserMentions = async (req, res, next) => {
	const handle = req.params.handle;
	const lastMentionId = req.query.lastMentionId;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		const mentions = await findMentionsByUserId(user._id, lastMentionId);
		res.status(200).json({ mentions });
	} catch (err) {
		res.status(500).send(err);
	}
};
const deactivateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const deactivated = await User.findByIdAndUpdate(userId, { deactivated: true });
		res.status(200).json({ deactivated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const activateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const activated = await User.findByIdAndUpdate(userId, { deactivated: false });
		res.status(200).json({ activated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const deleteUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const deleted = await User.findByIdAndUpdate(userId, { deleted: true });
		res.status(200).json({ deleted });
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports = {
	findActiveUserById,
	findActiveUserByHandle,
	findUserById,
	findUserByHandle,
	findPostsByUserId,
	findFavouritesByUserId,
	findFollowingByUserId,
	findFollowersByUserId,
	findMentionsByUserId,
	getUser,
	getUserPosts,
	getUserFavourites,
	getUserFollowing,
	getUserFollowers,
	getUserMentions,
	deactivateUser,
	activateUser,
	deleteUser
};