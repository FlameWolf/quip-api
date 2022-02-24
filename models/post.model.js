"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const postSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			text: true,
			validate: {
				validator: value => value.match(contentLengthRegExp).length <= maxContentLength,
				message: `Content length exceeds the maximum allowed limit`
			}
		},
		author: { type: ObjectId, ref: "User", required: true, index: true },
		repeatPost: { type: ObjectId, ref: "Post", index: true },
		replyTo: { type: ObjectId, ref: "Post", index: true },
		pinned: { type: Boolean }
	},
	{
		timestamps: true
	}
);
postSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Post", postSchema);