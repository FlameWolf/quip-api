"use strict";

const userPostsAggregationPipeline = require("../db/pipelines/user-posts");
const topmostAggregationPipeline = require("../db/pipelines/topmost");
const favouritesAggregationPipeline = require("../db/pipelines/favourites");
const followingAggregationPipeline = require("../db/pipelines/following");
const followersAggregationPipeline = require("../db/pipelines/followers");
const mentionsAggregationPipeline = require("../db/pipelines/mentions");
const blocksAggregationPipeline = require("../db/pipelines/blocks");
const mutedUsersAggregationPipeline = require("../db/pipelines/muted-users");
const mutedPostsAggregationPipeline = require("../db/pipelines/muted-posts");
const mutedWordsAggregationPipeline = require("../db/pipelines/muted-words");
const User = require("../models/user.model");
const Follow = require("../models/follow.model");
const Mention = require("../models/mention.model");
const Block = require("../models/block.model");
const MutedUser = require("../models/muted.user.model");
const MutedPost = require("../models/muted.post.model");
const MutedWord = require("../models/muted.word.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, deactivated: false, deleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, deactivated: false, deleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, deleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, deleted: false });
const findPostsByUserId = async (userId, includeRepeats, includeReplies, lastPostId = undefined) => await User.aggregate(userPostsAggregationPipeline(userId, includeRepeats, includeReplies, lastPostId));
const findFavouritesByUserId = async (userId, lastFavouriteId = undefined) => await User.aggregate(favouritesAggregationPipeline(userId, lastFavouriteId));
const findFollowingByUserId = async (userId, lastFollowId = undefined) => await Follow.aggregate(followingAggregationPipeline(userId, lastFollowId));
const findFollowersByUserId = async (userId, lastFollowId = undefined) => await Follow.aggregate(followersAggregationPipeline(userId, lastFollowId));
const findMentionsByUserId = async (userId, lastMentionId = undefined) => await Mention.aggregate(mentionsAggregationPipeline(userId, lastMentionId));
const findBlocksByUserId = async (userId, lastBlockId = undefined) => await Block.aggregate(blocksAggregationPipeline(userId, lastBlockId));
const findMutedUsersByUserId = async (userId, lastMuteId = undefined) => await MutedUser.aggregate(mutedUsersAggregationPipeline(userId, lastMuteId));
const findMutedPostsByUserId = async (userId, lastMuteId = undefined) => await MutedPost.aggregate(mutedPostsAggregationPipeline(userId, lastMuteId));
const findMutedWordsByUserId = async (userId, lastMuteId = undefined) => await MutedWord.aggregate(mutedWordsAggregationPipeline(userId, lastMuteId));
const getUser = async (req, res, next) => {
	const handle = req.params.handle;
	const userId = req.userInfo?.userId;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		if (userId) {
			const targetId = user._id;
			user.blocked = Block.countDocuments({ user: targetId, blockedBy: userId });
			user.muted = MutedUser.countDocuments({ user: targetId, mutedBy: userId });
		}
		res.status(200).json({ user });
	} catch (err) {
		next(err);
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
		next(err);
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
		next(err);
	}
};
const getUserTopmost = async (req, res, next) => {
	const { handle, period } = req.params;
	const userId = req.userInfo?.userId;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		const posts = await User.aggregate([
			{
				$match: { handle }
			},
			{
				$lookup: {
					from: "posts",
					localField: "_id",
					foreignField: "author",
					pipeline: topmostAggregationPipeline(userId, period),
					as: "posts"
				}
			},
			{
				$unwind: "$posts"
			},
			{
				$replaceWith: "$posts"
			}
		]);
		res.status(200).json({ posts });
	} catch (err) {
		next(err);
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
		next(err);
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
		next(err);
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
		next(err);
	}
};
const getBlocks = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const lastBlockId = req.query.lastBlockId;
	try {
		const blockedUsers = await findBlocksByUserId(userId, lastBlockId);
		res.status(200).json({ blockedUsers });
	} catch (err) {
		next(err);
	}
};
const getMutedUsers = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const lastMuteId = req.query.lastMuteId;
	try {
		const mutedUsers = await findMutedUsersByUserId(userId, lastMuteId);
		res.status(200).json({ mutedUsers });
	} catch (err) {
		next(err);
	}
};
const getMutedPosts = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const lastMuteId = req.query.lastMuteId;
	try {
		const mutedPosts = await findMutedPostsByUserId(userId, lastMuteId);
		res.status(200).json({ mutedPosts });
	} catch (err) {
		next(err);
	}
};
const getMutedWords = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const lastMuteId = req.query.lastMuteId;
	try {
		const mutedWords = await findMutedWordsByUserId(userId, lastMuteId);
		res.status(200).json({ mutedWords });
	} catch (err) {
		next(err);
	}
};
const deactivateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const deactivated = await User.findByIdAndUpdate(userId, { deactivated: true });
		res.status(200).json({ deactivated });
	} catch (err) {
		next(err);
	}
};
const activateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const activated = await User.findByIdAndUpdate(userId, { deactivated: false });
		res.status(200).json({ activated });
	} catch (err) {
		next(err);
	}
};
const deleteUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const deleted = await User.findByIdAndUpdate(userId, { deleted: true });
		res.status(200).json({ deleted });
	} catch (err) {
		next(err);
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
	getUserTopmost,
	getUserFavourites,
	getUserFollowing,
	getUserFollowers,
	getUserMentions,
	getBlocks,
	getMutedUsers,
	getMutedPosts,
	getMutedWords,
	deactivateUser,
	activateUser,
	deleteUser
};