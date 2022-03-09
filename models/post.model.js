"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Point = require("../schemaTypes/point.schema.type");

const postSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			validate: {
				validator: value => value.match(contentLengthRegExp).length <= maxContentLength,
				message: `Content length exceeds the maximum allowed limit`
			},
			index: "text"
		},
		author: { type: ObjectId, ref: "User", required: true, index: true },
		repeatPost: { type: ObjectId, ref: "Post", index: true },
		replyTo: { type: ObjectId, ref: "Post", index: true },
		attachments: { type: ObjectId, ref: "Attachments" },
		location: { type: Point, index: "2dsphere" }
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model("Post", postSchema);