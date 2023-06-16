"use strict";

import { ObjectId } from "bson";
import mongoose, { HydratedDocument, InferSchemaType } from "mongoose";
import * as bcrypt from "bcrypt";
import { noReplyEmail, passwordRegExp, rounds, emailTemplates } from "../library";
import userAggregationPipeline from "../db/pipelines/user";
import userPostsAggregationPipeline from "../db/pipelines/user-posts";
import topmostAggregationPipeline from "../db/pipelines/topmost";
import favouritesAggregationPipeline from "../db/pipelines/favourites";
import votesAggregationPipeline from "../db/pipelines/votes";
import bookmarksAggregationPipeline from "../db/pipelines/bookmarks";
import followingAggregationPipeline from "../db/pipelines/following";
import followersAggregationPipeline from "../db/pipelines/followers";
import followRequestsSentAggregationPipeline from "../db/pipelines/follow-requests-sent";
import followRequestsReceivedAggregationPipeline from "../db/pipelines/follow-requests-received";
import mentionsAggregationPipeline from "../db/pipelines/mentions";
import listsAggregationPipeline from "../db/pipelines/lists";
import listMembersAggregationPipeline from "../db/pipelines/list-members";
import blocksAggregationPipeline from "../db/pipelines/blocks";
import mutedUsersAggregationPipeline from "../db/pipelines/muted-users";
import mutedPostsAggregationPipeline from "../db/pipelines/muted-posts";
import mutedWordsAggregationPipeline from "../db/pipelines/muted-words";
import * as emailController from "./email.controller";
import * as postsController from "./posts.controller";
import User from "../models/user.model";
import Post from "../models/post.model";
import Favourite from "../models/favourite.model";
import Vote from "../models/vote.model";
import Bookmark from "../models/bookmark.model";
import Follow from "../models/follow.model";
import FollowRequest from "../models/follow-request.model";
import List from "../models/list.model";
import ListMember from "../models/list-member.model";
import Block from "../models/block.model";
import MutedUser from "../models/muted.user.model";
import MutedPost from "../models/muted.post.model";
import MutedWord from "../models/muted.word.model";
import EmailVerification from "../models/email-verification.model";
import RefreshToken from "../models/refresh-token.model";
import PasswordReset from "../models/password-reset.model";
import Settings from "../models/settings.model";
import { RequestHandler } from "express";

type UserModel = InferSchemaType<typeof User.schema>;

export const findActiveUserByHandle = async (handle: string) => (await User.findOne({ handle, deactivated: false, deleted: false })) as HydratedDocument<UserModel>;
export const findUserById = async (userId: string | ObjectId) => (await User.findOne({ _id: userId, deleted: false })) as HydratedDocument<UserModel>;
export const findUserByHandle = async (handle: string) => (await User.findOne({ handle, deleted: false })) as HydratedDocument<UserModel>;
export const findPostsByUserId = async (userId: ObjectId, includeRepeats?: boolean, includeReplies?: boolean, visitorId?: string | ObjectId, lastPostId?: string | ObjectId) => await User.aggregate(userPostsAggregationPipeline(userId, includeRepeats, includeReplies, visitorId, lastPostId));
export const findFavouritesByUserId = async (userId: string | ObjectId, lastFavouriteId?: string | ObjectId) => await User.aggregate(favouritesAggregationPipeline(userId, lastFavouriteId));
export const findVotesByUserId = async (userId: string | ObjectId, lastVoteId?: string | ObjectId) => await User.aggregate(votesAggregationPipeline(userId, lastVoteId));
export const findBookmarksByUserId = async (userId: string | ObjectId, lastBookmarkId?: string | ObjectId) => await User.aggregate(bookmarksAggregationPipeline(userId, lastBookmarkId));
export const findFollowingByUserId = async (userId: string | ObjectId, lastFollowId?: string | ObjectId) => await Follow.aggregate(followingAggregationPipeline(userId, lastFollowId));
export const findFollowersByUserId = async (userId: string | ObjectId, lastFollowId?: string | ObjectId) => await Follow.aggregate(followersAggregationPipeline(userId, lastFollowId));
export const findFollowRequestsSentByUserId = async (userId: string | ObjectId, lastFollowRequestId?: string | ObjectId) => await Follow.aggregate(followRequestsSentAggregationPipeline(userId, lastFollowRequestId));
export const findFollowRequestsReceivedByUserId = async (userId: string | ObjectId, lastFollowRequestId?: string | ObjectId) => await Follow.aggregate(followRequestsReceivedAggregationPipeline(userId, lastFollowRequestId));
export const findMentionsByUserId = async (userId: ObjectId, selfId?: string | ObjectId, lastMentionId?: string | ObjectId) => await Post.aggregate(mentionsAggregationPipeline(userId, selfId, lastMentionId));
export const findListsByUserId = async (userId: string | ObjectId, memberId?: string | ObjectId, lastListId?: string | ObjectId) => await List.aggregate(listsAggregationPipeline(userId, memberId, lastListId));
export const findMembersByListId = async (listId: ObjectId, lastMemberId?: string | ObjectId) => await ListMember.aggregate(listMembersAggregationPipeline(listId, lastMemberId));
export const findBlocksByUserId = async (userId: string | ObjectId, lastBlockId?: string | ObjectId) => await Block.aggregate(blocksAggregationPipeline(userId, lastBlockId));
export const findMutedUsersByUserId = async (userId: string | ObjectId, lastMuteId?: string | ObjectId) => await MutedUser.aggregate(mutedUsersAggregationPipeline(userId, lastMuteId));
export const findMutedPostsByUserId = async (userId: string | ObjectId, lastMuteId?: string | ObjectId) => await MutedPost.aggregate(mutedPostsAggregationPipeline(userId, lastMuteId));
export const findMutedWordsByUserId = async (userId: string | ObjectId, lastMuteId?: string | ObjectId) => (await MutedWord.aggregate(mutedWordsAggregationPipeline(userId, lastMuteId))) as Array<{ word: string; match: string }>;
export const getUser: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const user = (
		await User.aggregate([
			{
				$match: {
					handle,
					deactivated: false,
					deleted: false
				}
			},
			...userAggregationPipeline((req.userInfo as UserInfo)?.userId)
		])
	).shift();
	if (!user) {
		res.status(404).send("User not found");
		return;
	}
	res.status(200).json({ user });
};
export const getUserPosts: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const { includeRepeats, includeReplies, lastPostId } = req.query as Dictionary<string>;
	const visitorId = (req.userInfo as UserInfo)?.userId;
	const user = await findActiveUserByHandle(handle);
	if (!user) {
		res.status(404).send("User not found");
		return;
	}
	const posts = await findPostsByUserId(user._id, includeRepeats === "true", includeReplies === "true", visitorId, lastPostId);
	res.status(200).json({ posts });
};
export const getUserTopmost: RequestHandler = async (req, res, next) => {
	const { handle, period } = req.params;
	const { lastScore, lastPostId } = req.query as Dictionary<string>;
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
				pipeline: topmostAggregationPipeline((req.userInfo as UserInfo)?.userId, period, lastScore, lastPostId) as Array<any>,
				as: "posts"
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceRoot: {
				newRoot: "$posts"
			}
		}
	]);
	res.status(200).json({ posts });
};
export const getUserFavourites: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFavouriteId = req.query.lastFavouriteId;
	const userInfo = req.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		res.status(401).send();
		return;
	}
	const favourites = await findFavouritesByUserId(userInfo.userId, lastFavouriteId as string);
	res.status(200).json({ favourites });
};
export const getUserVotes: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastVoteId = req.query.lastVoteId;
	const userInfo = req.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		res.status(401).send();
		return;
	}
	const votes = await findVotesByUserId(userInfo.userId, lastVoteId as string);
	res.status(200).json({ votes });
};
export const getUserBookmarks: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastBookmarkId = req.query.lastBookmarkId;
	const userInfo = req.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		res.status(401).send();
		return;
	}
	const bookmarks = await findBookmarksByUserId(userInfo.userId, lastBookmarkId as string);
	res.status(200).json({ bookmarks });
};
export const getUserFollowing: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFollowId = req.query.lastFollowId;
	const userInfo = req.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		res.status(401).send();
		return;
	}
	const following = await findFollowingByUserId(userInfo.userId, lastFollowId as string);
	res.status(200).json({ following });
};
export const getUserFollowers: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFollowId = req.query.lastFollowId;
	const userInfo = req.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		res.status(401).send();
		return;
	}
	const followers = await findFollowersByUserId(userInfo.userId, lastFollowId as string);
	res.status(200).json({ followers });
};
export const getUserFollowRequestsSent: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFollowRequestId = req.query.lastFollowRequestId;
	const userInfo = req.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		res.status(401).send();
		return;
	}
	const followRequests = await findFollowRequestsSentByUserId(userInfo.userId, lastFollowRequestId as string);
	res.status(200).json({ followRequests });
};
export const getUserFollowRequestsReceived: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastFollowRequestId = req.query.lastFollowRequestId;
	const userInfo = req.userInfo as UserInfo;
	if (userInfo.handle !== handle) {
		res.status(401).send();
		return;
	}
	const followRequests = await findFollowRequestsReceivedByUserId(userInfo.userId, lastFollowRequestId as string);
	res.status(200).json({ followRequests });
};
export const getUserMentions: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const lastMentionId = req.query.lastMentionId;
	const user = await findActiveUserByHandle(handle);
	if (!user) {
		res.status(404).send("User not found");
		return;
	}
	const mentions = await findMentionsByUserId(user._id, (req.userInfo as UserInfo)?.userId, lastMentionId as string);
	res.status(200).json({ mentions });
};
export const getLists: RequestHandler = async (req, res, next) => {
	const { memberHandle, lastListId } = req.query as Dictionary<string>;
	const userId = (req.userInfo as UserInfo).userId;
	const member = await findUserByHandle(memberHandle);
	if (memberHandle && !member) {
		res.status(404).send("User not found");
		return;
	}
	const lists = await findListsByUserId(userId, member?._id, lastListId);
	res.status(200).json({ lists });
};
export const getListMembers: RequestHandler = async (req, res, next) => {
	const name = req.params.name;
	const lastMemberId = req.query.lastMemberId;
	const userId = (req.userInfo as UserInfo).userId;
	const list = await List.findOne({ name, owner: userId });
	if (!list) {
		res.status(404).send("List not found");
		return;
	}
	const members = await findMembersByListId(list._id, lastMemberId as string);
	res.status(200).json({ members });
};
export const getBlocks: RequestHandler = async (req, res, next) => {
	const lastBlockId = req.query.lastBlockId;
	const userId = (req.userInfo as UserInfo).userId;
	const blockedUsers = await findBlocksByUserId(userId, lastBlockId as string);
	res.status(200).json({ blockedUsers });
};
export const getMutedUsers: RequestHandler = async (req, res, next) => {
	const lastMuteId = req.query.lastMuteId;
	const userId = (req.userInfo as UserInfo).userId;
	const mutedUsers = await findMutedUsersByUserId(userId, lastMuteId as string);
	res.status(200).json({ mutedUsers });
};
export const getMutedPosts: RequestHandler = async (req, res, next) => {
	const lastMuteId = req.query.lastMuteId;
	const userId = (req.userInfo as UserInfo).userId;
	const mutedPosts = await findMutedPostsByUserId(userId, lastMuteId as string);
	res.status(200).json({ mutedPosts });
};
export const getMutedWords: RequestHandler = async (req, res, next) => {
	const lastMuteId = req.query.lastMuteId;
	const userId = (req.userInfo as UserInfo).userId;
	const mutedWords = await findMutedWordsByUserId(userId, lastMuteId as string);
	for (const mute of mutedWords) {
		mute.word = mute.word.replace(/\\(.)/g, "$1");
	}
	res.status(200).json({ mutedWords });
};
export const pinPost: RequestHandler = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = (req.userInfo as UserInfo).userId;
	const post = await postsController.findPostById(postId);
	if (!post) {
		res.status(404).send("Post not found");
		return;
	}
	if (post.author.toString() !== userId) {
		res.status(403).send("User can pin only their own post");
		return;
	}
	const pinned = await User.findByIdAndUpdate(userId, { pinnedPost: post._id }, { new: true });
	res.status(200).json({ pinned });
};
export const unpinPost: RequestHandler = async (req, res, next) => {
	const userId = (req.userInfo as UserInfo).userId;
	const unpinned = await User.findByIdAndUpdate(userId, { pinnedPost: undefined }, { new: true });
	res.status(200).json({ unpinned });
};
export const updateEmail: RequestHandler = async (req, res, next) => {
	const newEmail = req.body.email;
	const { handle, userId } = req.userInfo as UserInfo;
	const { email: currentEmail } = (await User.findById(userId, { email: 1 })) as HydratedDocument<UserModel>;
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
};
export const changePassword: RequestHandler = async (req, res, next) => {
	const userId = (req.userInfo as UserInfo).userId;
	const { oldPassword, newPassword } = req.body as Dictionary<string>;
	const user = (await User.findById(userId).select("+password +email")) as HydratedDocument<UserModel>;
	const email = user.email;
	const authStatus = bcrypt.compareSync(oldPassword, user.password);
	if (!authStatus) {
		res.status(403).send("Current password is incorrect");
		return;
	}
	if (!(newPassword && passwordRegExp.test(newPassword))) {
		res.status(400).send("New password is invalid");
		return;
	}
	const passwordHash = bcrypt.hashSync(newPassword, rounds);
	await User.findByIdAndUpdate(user._id, { password: passwordHash });
	res.status(200).send();
	if (email) {
		emailController.sendEmail(noReplyEmail, email, "Password changed", emailTemplates.notifications.passwordChanged(user.handle));
	}
};
export const deactivateUser: RequestHandler = async (req, res, next) => {
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const deactivated = (await User.findByIdAndUpdate(userId, { deactivated: true }, { new: true }).select("+email").session(session)) as HydratedDocument<UserModel>;
			const email = deactivated.email;
			await RefreshToken.deleteMany({ user: userId }).session(session);
			res.status(200).json({ deactivated });
			if (email) {
				emailController.sendEmail(noReplyEmail, email, "Account deactivated", emailTemplates.notifications.deactivated(deactivated.handle));
			}
		});
	} finally {
		await session.endSession();
	}
};
export const activateUser: RequestHandler = async (req, res, next) => {
	const userId = (req.userInfo as UserInfo).userId;
	const activated = (await User.findByIdAndUpdate(
		userId,
		{
			deactivated: false
		},
		{
			new: true
		}
	).select("+email")) as HydratedDocument<UserModel>;
	const email = activated.email;
	res.status(200).json({ activated });
	if (email) {
		emailController.sendEmail(noReplyEmail, email, "Account activated", emailTemplates.notifications.activated(activated.handle));
	}
};
export const deleteUser: RequestHandler = async (req, res, next) => {
	const userId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const userFilter = { user: userId };
			const ownerFilter = { owner: userId };
			const mutedByFilter = { mutedBy: userId };
			const deleted = (await User.findByIdAndUpdate(userId, { deleted: true }, { new: true }).select("+email").session(session)) as HydratedDocument<UserModel>;
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
				emailController.sendEmail(noReplyEmail, email, `Goodbye, ${deleted.handle}`, emailTemplates.notifications.activated(deleted.handle));
			}
		});
	} finally {
		await session.endSession();
	}
};