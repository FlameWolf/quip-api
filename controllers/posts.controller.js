"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const generalController = require("./general.controller");
const Post = require("../models/post.model");
const User = require("../models/user.model");

const createPost = async (req, res, next) => {
	const createPostAction = "Create post";
	const content = req.body.content;
	const userId = req.userInfo.userId;
	if (!content) {
		generalController.failureResponse(res, 400, createPostAction, "No content");
		return;
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		generalController.failureResponse(res, 400, createPostAction, "Content too long");
		return;
	}
	const model = new Post({ content, author: userId });
	try {
		const post = await model.save();
		await User.findByIdAndUpdate(userId, { $addToSet: { posts: post._id } });
		generalController.successResponse(res, 201, createPostAction, { post });
	} catch (err) {
		generalController.failureResponse(res, 500, createPostAction, err.message);
	}
};
const getPost = async (req, res, next) => {
	const getPostAction = "Get post";
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			generalController.failureResponse(res, 404, getPostAction, "Post not found");
			return;
		}
		generalController.successResponse(res, 200, getPostAction, { post });
	} catch (err) {
		generalController.failureResponse(res, 500, getPostAction, err.message);
	}
};
const favouritePost = async (req, res, next) => {
	const favouritePostAction = "Add favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const postUpdateResult = await Post.findByIdAndUpdate(postId, { $addToSet: { favouritedBy: userId } });
		if (!postUpdateResult) {
			generalController.failureResponse(res, 404, favouritePostAction, "Post not found");
			return;
		}
		const userUpdateResult = await User.findByIdAndUpdate(userId, { $addToSet: { favourites: postId } });
		generalController.successResponse(res, 200, favouritePostAction, {
			result: {
				favouritedPost: postUpdateResult,
				favouritedBy: userUpdateResult
			}
		});
	} catch (err) {
		generalController.failureResponse(res, 500, favouritePostAction, err.message);
	}
};
const unfavouritePost = async (req, res, next) => {
	const unfavouritePostAction = "Remove favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const postUpdateResult = await Post.findByIdAndUpdate(postId, { $pull: { favouritedBy: userId } });
		const userUpdateResult = await User.findByIdAndUpdate(userId, { $pull: { favourites: postId } });
		generalController.successResponse(res, 200, unfavouritePostAction, {
			result: {
				unfavouritedPost: postUpdateResult,
				unfavouritedBy: userUpdateResult
			}
		});
	} catch (err) {
		generalController.failureResponse(res, 500, unfavouritePostAction, err.message);
	}
};
const repeatPost = async (req, res, next) => {
	const repeatPostAction = "Repeat";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const payload = {
		author: userId,
		repeatPost: postId
	};
	try {
		if (!(await Post.findById(postId))) {
			generalController.failureResponse(res, 404, repeatPostAction, "Post not found");
			return;
		}
		if (await Post.find(payload)) {
			await Post.deleteOne(payload);
		}
		const post = await new Post(payload).save();
		await User.findByIdAndUpdate(userId, { $addToSet: { posts: post._id } });
		generalController.successResponse(res, 201, repeatPostAction, { post });
	} catch (err) {
		generalController.failureResponse(res, 500, repeatPostAction, err.message);
	}
};
const unrepeatPost = async (req, res, next) => {
	const unrepeatPostAction = "Undo repeat";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const post = await Post.findOneAndDelete({
			author: userId,
			repeatPost: postId
		});
		await User.findByIdAndUpdate(userId, { $pull: { posts: post._id } });
		generalController.successResponse(res, 200, unrepeatPostAction, post);
	} catch (err) {
		generalController.failureResponse(res, 500, unrepeatPostAction, err.message);
	}
};
const replyToPost = async (req, res, next) => {
	const replyToPostAction = "Reply to post";
	const content = req.body.content;
	const replyTo = req.params.postId;
	const userId = req.userInfo.userId;
	if (!content) {
		generalController.failureResponse(res, 400, replyToPostAction, "No content");
		return;
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		generalController.failureResponse(res, 400, createPostAction, "Content too long");
		return;
	}
	if (!(await Post.findById(replyTo))) {
		generalController.failureResponse(res, 404, replyToPostAction, "Post not found");
		return;
	}
	const model = new Post({ content, author: userId, replyTo });
	try {
		const reply = await model.save();
		const repliedTo = await Post.findByIdAndUpdate(replyTo, { $addToSet: { replies: reply._id } });
		await User.findByIdAndUpdate(userId, { $addToSet: { posts: reply._id } });
		generalController.successResponse(res, 201, replyToPostAction, { reply, repliedTo });
	} catch (err) {
		generalController.failureResponse(res, 500, replyToPostAction, err.message);
	}
};
const deletePost = async (req, res, next) => {
	const deletePostAction = "Delete post";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const post = await Post.findOne({
			_id: postId,
			author: userId
		});
		if (!post) {
			generalController.failureResponse(res, 404, deletePostAction, "Post not found");
			return;
		}
		const result = await Post.deleteOne(post);
		if (result.deletedCount === 1) {
			const parentPostId = post.replyTo;
			await User.findByIdAndUpdate(userId, { $pull: { posts: post._id } });
			if (parentPostId) {
				await Post.findByIdAndUpdate(parentPostId, { $pull: { replies: postId } });
			}
		}
		generalController.successResponse(res, 200, deletePostAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, deletePostAction, err.message);
	}
};

module.exports = {
	createPost,
	getPost,
	favouritePost,
	unfavouritePost,
	repeatPost,
	unrepeatPost,
	replyToPost,
	deletePost
};