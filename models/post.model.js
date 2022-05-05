"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { contentLengthRegExp, maxContentLength } = require("../library");
const User = require("./user.model");
const Attachments = require("./attachments.model");
const Mention = require("./mention.model");
const Favourite = require("./favourite.model");
const Bookmark = require("./bookmark.model");
const MutedPost = require("./muted.post.model");

const postSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			validate: {
				validator: value => value.match(contentLengthRegExp).length <= maxContentLength,
				message: "Content length exceeds the maximum allowed limit"
			},
			index: {
				text: true,
				default_language: "none",
				collation: {
					locale: "simple"
				}
			}
		},
		author: { type: ObjectId, ref: "User", required: true, index: true },
		repeatPost: { type: ObjectId, ref: "Post", index: true },
		replyTo: { type: ObjectId, ref: "Post", index: true },
		attachments: { type: ObjectId, ref: "Attachments" },
		location: { type: mongoose.SchemaTypes.Point, index: "2dsphere" }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
postSchema.post("findOneAndDelete", async post => {
	const postId = post?._id;
	if (postId) {
		const filter = { post: postId };
		await Promise.allSettled([
			User.findOneAndUpdate(
				{
					pinnedPost: postId
				},
				{
					pinnedPost: undefined
				}
			),
			Post.deleteMany({ repeatPost: postId }),
			Attachments.findOneAndDelete(post.attachments),
			Mention.deleteMany(filter),
			Favourite.deleteMany(filter),
			Bookmark.deleteMany(filter),
			MutedPost.deleteMany(filter)
		]);
	}
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;