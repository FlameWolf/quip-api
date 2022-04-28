"use strict";

const { contentLengthRegExp, maxContentLength } = require("../library");
const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
	{
		content: {
			type: String,
			validate: {
				validator: value => value.match(contentLengthRegExp).length <= maxContentLength,
				message: "Content length exceeds the maximum allowed limit"
			},
			text: true
		},
		author: { type: ObjectId, ref: "User", required: true, index: true },
		repeatPost: { type: ObjectId, ref: "Post", index: true },
		replyTo: { type: ObjectId, ref: "Post", index: true },
		attachments: { type: ObjectId, ref: "Attachments" },
		private: { type: Boolean, default: false },
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

module.exports = mongoose.model("Post", postSchema);