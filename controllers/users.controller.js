"use strict";

const mongoose = require("mongoose");
const { ObjectId } = require("bson");
const { noReplyEmail } = require("../library");
const userPostsAggregationPipeline = require("../db/pipelines/user-posts");
const topmostAggregationPipeline = require("../db/pipelines/topmost");
const favouritesAggregationPipeline = require("../db/pipelines/favourites");
const bookmarksAggregationPipeline = require("../db/pipelines/bookmarks");
const followingAggregationPipeline = require("../db/pipelines/following");
const followersAggregationPipeline = require("../db/pipelines/followers");
const mentionsAggregationPipeline = require("../db/pipelines/mentions");
const blocksAggregationPipeline = require("../db/pipelines/blocks");
const mutedUsersAggregationPipeline = require("../db/pipelines/muted-users");
const mutedPostsAggregationPipeline = require("../db/pipelines/muted-posts");
const mutedWordsAggregationPipeline = require("../db/pipelines/muted-words");
const emailController = require("./email.controller");
const User = require("../models/user.model");
const Follow = require("../models/follow.model");
const Mention = require("../models/mention.model");
const Block = require("../models/block.model");
const MutedUser = require("../models/muted.user.model");
const MutedPost = require("../models/muted.post.model");
const MutedWord = require("../models/muted.word.model");
const EmailVerification = require("../models/email-verification.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, deactivated: false, deleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, deactivated: false, deleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, deleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, deleted: false });
const findPostsByUserId = async (userId, includeRepeats, includeReplies, lastPostId = undefined) => await User.aggregate(userPostsAggregationPipeline(userId, includeRepeats, includeReplies, lastPostId));
const findFavouritesByUserId = async (userId, lastFavouriteId = undefined) => await User.aggregate(favouritesAggregationPipeline(userId, lastFavouriteId));
const findBookmarksByUserId = async (userId, lastBookmarkId = undefined) => await User.aggregate(bookmarksAggregationPipeline(userId, lastBookmarkId));
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
const getUserTopmost = async (req, res, next) => {
	const { handle, period } = req.params;
	const userId = req.userInfo?.userId;
	try {
		const filter = { handle };
		if (!(await User.countDocuments(filter))) {
			res.status(404).send("User not found");
			return;
		}
		const posts = await User.aggregate([
			{
				$match: filter
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
const getUserFavourites = async (req, res, next) => {
	const handle = req.params.handle;
	const userInfo = req.userInfo;
	if (userInfo.handle !== handle) {
		res.sendStatus(401);
		return;
	}
	try {
		const favourites = await findFavouritesByUserId(userInfo.userId, req.query.lastFavouriteId);
		res.status(200).json({ favourites });
	} catch (err) {
		next(err);
	}
};
const getUserBookmarks = async (req, res, next) => {
	const handle = req.params.handle;
	const userInfo = req.userInfo;
	if (userInfo.handle !== handle) {
		res.sendStatus(401);
		return;
	}
	try {
		const bookmarks = await findBookmarksByUserId(userInfo.userId, req.query.lastBookmarkId);
		res.status(200).json({ bookmarks });
	} catch (err) {
		next(err);
	}
};
const getUserFollowing = async (req, res, next) => {
	const handle = req.params.handle;
	const userInfo = req.userInfo;
	if (userInfo.handle !== handle) {
		res.sendStatus(401);
		return;
	}
	try {
		const following = await findFollowingByUserId(userInfo.userId, req.query.lastFollowId);
		res.status(200).json({ following });
	} catch (err) {
		next(err);
	}
};
const getUserFollowers = async (req, res, next) => {
	const handle = req.params.handle;
	const userInfo = req.userInfo;
	if (userInfo.handle !== handle) {
		res.sendStatus(401);
		return;
	}
	try {
		const followers = await findFollowersByUserId(userInfo.userId, req.query.lastFollowId);
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
const updateEmail = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const { oldEmail, newEmail } = req.body;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const updated = await User.findOneAndUpdate(
				{
					_id: userId,
					email: oldEmail || { $exists: false }
				},
				{
					email: newEmail,
					emailVerified: false
				},
				{
					new: true
				}
			).session(session);
			const emailVerification = await new EmailVerification({
				user: userId,
				token: new ObjectId()
			}).save({ session });
			await emailController.sendEmail(noReplyEmail, newEmail, "Verify your email", `Hi @${req.userInfo.handle}, your email address on Quip was updated from to ${newEmail} on ${new Date()}. Click <a href="${req.protocol}://${req.get("Host")}/verify-email/${emailVerification.token}">here</a> to verify that this is correct.`);
			res.status(200).json({ updated });
		});
		if (oldEmail) {
			await emailController.sendEmail(noReplyEmail, oldEmail, "Email change notification", `Hi @${req.userInfo.handle}, your email address on Quip was updated from ${oldEmail} to ${newEmail} on ${new Date()}.`);
		}
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
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
	getUserBookmarks,
	getUserFollowing,
	getUserFollowers,
	getUserMentions,
	getBlocks,
	getMutedUsers,
	getMutedPosts,
	getMutedWords,
	updateEmail,
	deactivateUser,
	activateUser,
	deleteUser
};