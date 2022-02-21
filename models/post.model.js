"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const postSchema = new mongoose.Schema(
	{
		content: { type: String },
		author: { type: ObjectId, ref: "User", required: true, index: true },
		repeatPost: { type: ObjectId, ref: "Post" },
		replyTo: { type: ObjectId, ref: "Post" },
		favouritedBy: [{ type: ObjectId, ref: "User", select: false }],
		repeatedBy: [{ type: ObjectId, ref: "User", select: false }],
		replies: [{ type: ObjectId, ref: "Post", select: false }],
		pinned: { type: Boolean }
	},
	{
		timestamps: true
	}
);
postSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Post", postSchema);