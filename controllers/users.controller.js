"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { noReplyEmail, passwordRegExp, rounds, emailTemplates } = require("../library");
const userAggregationPipeline = require("../db/pipelines/user");
const userPostsAggregationPipeline = require("../db/pipelines/user-posts");
const topmostAggregationPipeline = require("../db/pipelines/topmost");
const favouritesAggregationPipeline = require("../db/pipelines/favourites");
const votesAggregationPipeline = require("../db/pipelines/votes");
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
const postsController = require("./posts.controller");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Favourite = require("../models/favourite.model");
const Vote = require("../models/vote.model");
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
const RefreshToken = require("../models/refresh-token.model");
const PasswordReset = require("../models/password-reset.model");
const Settings = require("../models/settings.model");

const findActiveUserByHandle = async handle => await User.findOne({ handle, deactivated: false, deleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, deleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, deleted: false });
const findPostsByUserId = async (userId, includeRepeats, includeReplies, lastPostId = undefined) => await User.aggregate(userPostsAggregationPipeline(userId, includeRepeats, includeReplies, lastPostId));
const findFavouritesByUserId = async (userId, lastFavouriteId = undefined) => await User.aggregate(favouritesAggregationPipeline(userId, lastFavouriteId));
const findVotesByUserId = async (userId, lastVoteId = undefined) => await User.aggregate(votesAggregationPipeline(userId, lastVoteId));
const findBookmarksByUserId = async (userId, lastBookmarkId = undefined) => await User.aggregate(bookmarksAggregationPipeline(userId, lastBookmarkId));
const findFollowingByUserId = async (userId, lastFollowId = undefined) => await Follow.aggregate(followingAggregationPipeline(userId, lastFollowId));
const findFollowersByUserId = async (userId, lastFollowId = undefined) => await Follow.aggregate(followersAggregationPipeline(userId, lastFollowId));
const findFollowRequestsSentByUserId = async (userId, lastFollowRequestId = undefined) => await Follow.aggregate(followRequestsSentAggregationPipeline(userId, lastFollowRequestId));
const findFollowRequestsReceivedByUserId = async (userId, lastFollowRequestId = undefined) => await Follow.aggregate(followRequestsReceivedAggregationPipeline(userId, lastFollowRequestId));
const findMentionsByUserId = async (userId, selfId = undefined, lastMentionId = undefined) => await Post.aggregate(mentionsAggregationPipeline(userId, selfId, lastMentionId));
const findListsByUserId = async (userId, memberId = undefined, lastListId = undefined) => await List.aggregate(listsAggregationPipeline(userId, memberId, lastListId));
const findMembersByListId = async (listId, lastMemberId = undefined) => await ListMember.aggregate(listMembersAggregationPipeline(listId, lastMemberId));
const findBlocksByUserId = async (userId, lastBlockId = undefined) => await Block.aggregate(blocksAggregationPipeline(userId, lastBlockId));
const findMutedUsersByUserId = async (userId, lastMuteId = undefined) => await MutedUser.aggregate(mutedUsersAggregationPipeline(userId, lastMuteId));
const findMutedPostsByUserId = async (userId, lastMuteId = undefined) => await MutedPost.aggregate(mutedPostsAggregationPipeline(userId, lastMuteId));
const findMutedWordsByUserId = async (userId, lastMuteId = undefined) => await MutedWord.aggregate(mutedWordsAggregationPipeline(userId, lastMuteId));
const getUser = async (req, res, next) => {
	const handle = req.params.handle;
	try {
		const user = (
			await User.aggregate([
				{
					$match: {
						handle,
						deactivated: false,
						deleted: false
					}
				},
				...userAggregationPipeline(req.userInfo?.userId)
			])
		).shift();
		if (!user) {
			res.status(404).send("User not found");
			return;
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
	const { lastScore, lastPostId } = req.query;
	const selfId = req.userInfo?.userId;
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
					pipeline: topmostAggregationPipeline(selfId, period, lastScore, lastPostId),
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
const getUserVotes = async (req, res, next) => {
	const handle = req.params.handle;
	const userInfo = req.userInfo;
	if (userInfo.handle !== handle) {
		res.sendStatus(401);
		return;
	}
	try {
		const votes = await findVotesByUserId(userInfo.userId, req.query.lastVoteId);
		res.status(200).json({ votes });
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
		const mentions = await findMentionsByUserId(user._id, req.userInfo?.userId, lastMentionId);
		res.status(200).json({ mentions });
	} catch (err) {
		next(err);
	}
};
const getLists = async (req, res, next) => {
	const { memberHandle, lastListId } = req.query;
	const userId = req.userInfo.userId;
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
	const name = req.params.name;
	const lastMemberId = req.query.lastMemberId;
	const userId = req.userInfo.userId;
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
	const lastBlockId = req.query.lastBlockId;
	const userId = req.userInfo.userId;
	try {
		const blockedUsers = await findBlocksByUserId(userId, lastBlockId);
		res.status(200).json({ blockedUsers });
	} catch (err) {
		next(err);
	}
};
const getMutedUsers = async (req, res, next) => {
	const lastMuteId = req.query.lastMuteId;
	const userId = req.userInfo.userId;
	try {
		const mutedUsers = await findMutedUsersByUserId(userId, lastMuteId);
		res.status(200).json({ mutedUsers });
	} catch (err) {
		next(err);
	}
};
const getMutedPosts = async (req, res, next) => {
	const lastMuteId = req.query.lastMuteId;
	const userId = req.userInfo.userId;
	try {
		const mutedPosts = await findMutedPostsByUserId(userId, lastMuteId);
		res.status(200).json({ mutedPosts });
	} catch (err) {
		next(err);
	}
};
const getMutedWords = async (req, res, next) => {
	const lastMuteId = req.query.lastMuteId;
	const userId = req.userInfo.userId;
	try {
		const mutedWords = await findMutedWordsByUserId(userId, lastMuteId);
		for (mute of mutedWords) {
			mute.word = mute.word.replace(/\\(.)/g, "$1");
		}
		res.status(200).json({ mutedWords });
	} catch (err) {
		next(err);
	}
};
const pinPost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const post = await postsController.findPostById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		if (post.author.valueOf() !== userId) {
			res.status(403).send("User can pin only their own post");
			return;
		}
		const pinned = await User.findByIdAndUpdate(userId, { pinnedPost: post._id }, { new: true });
		res.status(200).json({ pinned });
	} catch (err) {
		next(err);
	}
};
const unpinPost = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const unpinned = await User.findByIdAndUpdate(userId, { pinnedPost: undefined }, { new: true });
		res.status(200).json({ unpinned });
	} catch (err) {
		next(err);
	}
};
const updateEmail = async (req, res, next) => {
	const newEmail = req.body.email;
	const { handle, userId } = req.userInfo;
	try {
		const { email: currentEmail } = await User.findById(userId, { email: 1 });
		const emailVerification = await new EmailVerification({
			user: userId,
			email: newEmail,
			previousEmail: currentEmail,
			token: new ObjectId()
		}).save();
		res.status(200).json({ emailVerification });
		if (currentEmail) {
			emailController.sendEmail(noReplyEmail, currentEmail, "Email address changed", emailTemplates.actions.rejectEmail(handle, currentEmail, `${process.env.ALLOW_ORIGIN}/reject-email/${emailVerification.token}`));
		}
		emailController.sendEmail(noReplyEmail, newEmail, "Verify email address", emailTemplates.actions.verifyEmail(handle, newEmail, `${process.env.ALLOW_ORIGIN}/verify-email/${emailVerification.token}`));
	} catch (err) {
		next(err);
	}
};
const changePassword = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const { oldPassword, newPassword } = req.body;
	try {
		const user = await User.findById(userId).select("+password +email");
		const email = user.email;
		const authStatus = await bcrypt.compare(oldPassword, user.password);
		if (!authStatus) {
			res.status(403).send("Current password is incorrect");
			return;
		}
		if (!(newPassword && passwordRegExp.test(newPassword))) {
			res.status(400).send("New password is invalid");
			return;
		}
		const passwordHash = await bcrypt.hash(newPassword, rounds);
		await User.updateOne(user, { password: passwordHash });
		res.sendStatus(200);
		if (email) {
			emailController.sendEmail(noReplyEmail, email, "Password changed", emailTemplates.notifications.passwordChanged(user.handle));
		}
	} catch (err) {
		next(err);
	}
};
const deactivateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const deactivated = await User.findByIdAndUpdate(userId, { deactivated: true }, { new: true }).select("+email").session(session);
			const email = deactivated.email;
			await RefreshToken.deleteMany({ user: userId }).session(session);
			res.status(200).json({ deactivated });
			if (email) {
				emailController.sendEmail(noReplyEmail, email, "Account deactivated", emailTemplates.notifications.deactivated(deactivated.handle));
			}
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const activateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const activated = await User.findByIdAndUpdate(
			userId,
			{
				deactivated: false
			},
			{
				new: true
			}
		).select("+email");
		const email = activated.email;
		res.status(200).json({ activated });
		if (email) {
			emailController.sendEmail(noReplyEmail, email, "Account activated", emailTemplates.notifications.activated(activated.handle));
		}
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
			const deleted = await User.findByIdAndUpdate(userId, { deleted: true }, { new: true }).select("+email").session(session);
			const email = deleted.email;
			await Promise.all([
				Favourite.deleteMany({ favouritedBy: userId }).session(session),
				Vote.deleteMany(userFilter).session(session),
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
				RefreshToken.deleteMany(userFilter).session(session),
				PasswordReset.deleteMany(userFilter).session(session),
				Settings.deleteMany(userFilter).session(session)
			]);
			res.status(200).json({ deleted });
			if (email) {
				emailController.sendEmail(noReplyEmail, email, "Account activated", emailTemplates.notifications.activated(deleted.handle));
			}
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};

module.exports = {
	findActiveUserByHandle,
	findUserById,
	findUserByHandle,
	getUser,
	getUserPosts,
	getUserTopmost,
	getUserFavourites,
	getUserVotes,
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
	pinPost,
	unpinPost,
	updateEmail,
	changePassword,
	deactivateUser,
	activateUser,
	deleteUser
};