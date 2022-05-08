"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { contentLengthRegExp, maxContentLength, maxPollOptionLength } = require("../library");

const Schema = mongoose.Schema;
const validatePollOption = {
	validator: value => value.match(contentLengthRegExp).length <= maxPollOptionLength,
	message: "Poll option length exceeds the maximum allowed limit"
};
const postSchema = new Schema(
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
		attachments: new Schema({
			post: { type: ObjectId, ref: "Post" },
			poll: new Schema({
				first: {
					type: String,
					required: true,
					validate: validatePollOption
				},
				second: {
					type: String,
					required: true,
					validate: validatePollOption
				},
				third: {
					type: String,
					validate: validatePollOption
				},
				fourth: {
					type: String,
					validate: validatePollOption
				},
				nota: { type: Boolean }
			}),
			mediaFile: new Schema({
				fileType: {
					type: String,
					enum: ["image", "video"],
					required: true
				},
				src: { type: mongoose.SchemaTypes.Url, required: true },
				previewSrc: { type: mongoose.SchemaTypes.Url },
				description: {
					type: String,
					index: {
						text: true,
						default_language: "none",
						collation: {
							locale: "simple"
						}
					}
				}
			})
		}),
		location: { type: mongoose.SchemaTypes.Point, index: "2dsphere" },
		mentions: {
			type: [{ type: ObjectId, ref: "User" }],
			index: true
		},
		hashtags: {
			type: [{ type: String }],
			index: true
		}
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