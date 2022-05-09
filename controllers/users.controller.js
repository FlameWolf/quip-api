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
const followRequestsSentAggregationPipeline = require("../db/pipelines/follow-requests-sent");
const followRequestsReceivedAggregationPipeline = require("../db/pipelines/follow-requests-received");
const mentionsAggregationPipeline = require("../db/pipelines/mentions");
const listsAggregationPipeline = require("../db/pipelines/lists");
const listMembersAggregationPipeline = require("../db/pipelines/list-members");
const blocksAggregationPipeline = require("../db/pipelines/blocks");
const mutedUsersAggregationPipeline = require("../db/pipelines/muted-users");
const mutedPostsAggregationPipeline = require("../db/pipelines/muted-posts");
const mutedWordsAggregationPipeline = require("../db/pipelines/muted-words");
const emailController = require("./email.controller");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Favourite = require("../models/favourite.model");
const Bookmark = require("../models/bookmark.model");
const Follow = require("../models/follow.model");
const FollowRequest = require("../models/follow-request.model");
const List = require("../models/list.model");
const ListMember = require("../models/list-member.model");
const Block = require("../models/block.model");
const MutedUser = require("../models/muted.user.model");
const MutedPost = require("../models/muted.post.model");
const MutedWord = require("../models/muted.word.model");
const EmailVerification = require("../models/email-verification.model");
const Vote = require("../models/vote.model");
const Settings = require("../models/settings.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, deactivated: false, deleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, deactivated: false, deleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, deleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, deleted: false });
const findPostsByUserId = async (userId, includeRepeats, includeReplies, lastPostId = undefined) => await User.aggregate(userPostsAggregationPipeline(userId, includeRepeats, includeReplies, lastPostId));
const findFavouritesByUserId = async (userId, lastFavouriteId = undefined) => await User.aggregate(favouritesAggregationPipeline(userId, lastFavouriteId));
const findBookmarksByUserId = async (userId, lastBookmarkId = undefined) => await User.aggregate(bookmarksAggregationPipeline(userId, lastBookmarkId));
const findFollowingByUserId = async (userId, lastFollowId = undefined) => await Follow.aggregate(followingAggregationPipeline(userId, lastFollowId));
const findFollowersByUserId = async (userId, lastFollowId = undefined) => await Follow.aggregate(followersAggregationPipeline(userId, lastFollowId));
const findFollowRequestsSentByUserId = async (userId, lastFollowRequestId = undefined) => await Follow.aggregate(followRequestsSentAggregationPipeline(userId, lastFollowRequestId));
const findFollowRequestsReceivedByUserId = async (userId, lastFollowRequestId = undefined) => await Follow.aggregate(followRequestsReceivedAggregationPipeline(userId, lastFollowRequestId));
const findMentionsByUserId = async (userId, lastMentionId = undefined) => await Post.aggregate(mentionsAggregationPipeline(userId, lastMentionId));
const findListsByUserId = async (userId, memberId = undefined, lastListId = undefined) => await List.aggregate(listsAggregationPipeline(userId, memberId, lastListId));
const findMembersByListId = async (listId, lastMemberId = undefined) => await ListMember.aggregate(listMembersAggregationPipeline(listId, lastMemberId));
const findBlocksByUserId = async (userId, lastBlockId = undefined) => await Block.aggregate(blocksAggregationPipeline(userId, lastBlockId));
const findMutedUsersByUserId = async (userId, lastMuteId = undefined) => await MutedUser.aggregate(mutedUsersAggregationPipeline(userId, lastMuteId));
const findMutedPostsByUserId = async (userId, lastMuteId = undefined) => await MutedPost.aggregate(mutedPostsAggregationPipeline(userId, lastMuteId));
const findMutedWordsByUserId = async (userId, lastMuteId = undefined) => await MutedWord.aggregate(mutedWordsAggregationPipeline(userId, lastMuteId));
const getUser = async (req, res, next) => {
	const handle = req.params.handle;
	const selfId = req.userInfo?.userId;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		if (selfId) {
			const targetId = user._id;
			[
				user.blockedMe,
				user.blockedByMe,
				user.followedMe,
				user.followedByMe,
				user.requestedToFollowMe,
				user.requestedToFollowByMe,
				user.mutedByMe
			] = await Promise.all
			([
				Block.countDocuments({
					user: selfId,
					blockedBy: targetId
				}),
				Block.countDocuments({
					user: targetId,
					blockedBy: selfId
				}),
				Follow.countDocuments({
					user: selfId,
					followedBy: targetId
				}),
				Follow.countDocuments({
					user: targetId,
					followedBy: selfId
				}),
				FollowRequest.countDocuments({
					user: selfId,
					requestedBy: targetId
				}),
				FollowRequest.countDocuments({
					user: targetId,
					requestedBy: selfId
				}),
				MutedUser.countDocuments({
					user: targetId,
					mutedBy: selfId
				})
			]);
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
const getUserFollowRequestsSent = async (req, res, next) => {
	const handle = req.params.handle;
	const userInfo = req.userInfo;
	if (userInfo.handle !== handle) {
		res.sendStatus(401);
		return;
	}
	try {
		const followRequests = await findFollowRequestsSentByUserId(userInfo.userId, req.query.lastFollowRequestId);
		res.status(200).json({ followRequests });
	} catch (err) {
		next(err);
	}
};
const getUserFollowRequestsReceived = async (req, res, next) => {
	const handle = req.params.handle;
	const userInfo = req.userInfo;
	if (userInfo.handle !== handle) {
		res.sendStatus(401);
		return;
	}
	try {
		const followRequests = await findFollowRequestsReceivedByUserId(userInfo.userId, req.query.lastFollowRequestId);
		res.status(200).json({ followRequests });
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
const getLists = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const { memberHandle, lastListId } = req.query;
	try {
		const member = await findUserByHandle(memberHandle);
		if (memberHandle && !member) {
			res.status(404).send("User not found");
			return;
		}
		const lists = await findListsByUserId(userId, member?._id, lastListId);
		res.status(200).json({ lists });
	} catch (err) {
		next(err);
	}
};
const getListMembers = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const name = req.params.name;
	const lastMemberId = req.query.lastMemberId;
	try {
		const list = await List.findOne({ name, owner: userId });
		if (!list) {
			res.status(404).send("List not found");
			return;
		}
		const members = await findMembersByListId(list._id, lastMemberId);
		res.status(200).json({ members });
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
		const deactivated = await User.findByIdAndUpdate(userId, { deactivated: true }, { new: true });
		res.status(200).json({ deactivated });
	} catch (err) {
		next(err);
	}
};
const activateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const activated = await User.findByIdAndUpdate(userId, { deactivated: false }, { new: true });
		res.status(200).json({ activated });
	} catch (err) {
		next(err);
	}
};
const deleteUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const userFilter = { user: userId };
			const ownerFilter = { owner: userId };
			const mutedByFilter = { mutedBy: userId };
			const deleted = await User.findByIdAndUpdate(userId, { deleted: true }, { new: true }).session(session);
			await Promise.all([
				Favourite.deleteMany({ favouritedBy: userId }).session(session),
				Bookmark.deleteMany({ bookmarkedBy: userId }).session(session),
				Follow.deleteMany({
					$or: [userFilter, { followedBy: userId }]
				}).session(session),
				FollowRequest.deleteMany({
					$or: [userFilter, { favouritedBy: userId }]
				}).session(session),
				List.deleteMany(ownerFilter).session(session),
				ListMember.deleteMany({
					$or: [userFilter, { list: await List.find(ownerFilter, { _id: 1 }) }]
				}).session(session),
				Block.deleteMany({
					$or: [userFilter, { blockedBy: userId }]
				}).session(session),
				MutedPost.deleteMany(mutedByFilter).session(session),
				MutedUser.deleteMany({
					$or: [userFilter, mutedByFilter]
				}).session(session),
				MutedWord.deleteMany(mutedByFilter).session(session),
				EmailVerification.deleteMany(userFilter).session(session),
				Vote.deleteMany(userFilter).session(session),
				Settings.deleteMany(userFilter).session(session)
			]);
			res.status(200).json({ deleted });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};

module.exports = {
	findActiveUserById,
	findActiveUserByHandle,
	findUserById,
	findUserByHandle,
	getUser,
	getUserPosts,
	getUserTopmost,
	getUserFavourites,
	getUserBookmarks,
	getUserFollowing,
	getUserFollowers,
	getUserFollowRequestsSent,
	getUserFollowRequestsReceived,
	getUserMentions,
	getLists,
	getListMembers,
	getBlocks,
	getMutedUsers,
	getMutedPosts,
	getMutedWords,
	updateEmail,
	deactivateUser,
	activateUser,
	deleteUser
};