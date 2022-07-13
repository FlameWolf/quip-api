"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { Url, Point } = mongoose.SchemaTypes;
const { contentLengthRegExp, maxContentLength, maxPollOptionLength, minPollDuration, maxPollDuration } = require("../library");

const Schema = mongoose.Schema;
const validatePollOption = {
	validator: value => (value.match(contentLengthRegExp)?.length || 0) <= maxPollOptionLength,
	message: "Poll option length exceeds the maximum allowed limit"
};
const postSchema = new Schema(
	{
		content: {
			type: String,
			trim: true,
			validate: {
				validator: value => (value.match(contentLengthRegExp)?.length || 0) <= maxContentLength,
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
			poll: new Schema({
				first: { type: String, trim: true, required: true, validate: validatePollOption },
				second: { type: String, trim: true, required: true, validate: validatePollOption },
				third: { type: String, trim: true, validate: validatePollOption },
				fourth: {
					type: String,
					trim: true,
					validate: [
						{
							validator: function () {
								return Boolean(this.third);
							},
							message: "Cannot specify fourth option when third option is blank"
						},
						validatePollOption
					]
				},
				duration: {
					type: Number,
					min: minPollDuration,
					max: maxPollDuration,
					default: 86400000
				},
				votes: {
					first: { type: Number, default: 0 },
					second: { type: Number, default: 0 },
					third: {
						type: Number,
						default: function () {
							return this.third && 0;
						}
					},
					fourth: {
						type: Number,
						default: function () {
							return this.fourth && 0;
						}
					},
					nota: { type: Number, default: 0 }
				}
			}),
			mediaFile: new Schema({
				fileType: {
					type: String,
					enum: ["image", "video"],
					required: true
				},
				src: { type: Url, required: true },
				previewSrc: { type: Url },
				description: { type: String, trim: true }
			}),
			post: { type: ObjectId, ref: "Post", index: true }
		}),
		languages: {
			type: [
				{
					type: String,
					trim: true,
					validate: {
						validator: value => value.length === 2,
						message: "Language code must be exactly two characters long"
					}
				}
			],
			index: true
		},
		location: { type: Point, index: "2dsphere" },
		mentions: {
			type: [{ type: ObjectId, ref: "User" }],
			default: undefined,
			index: true
		},
		hashtags: {
			type: [{ type: String }],
			default: undefined,
			index: true
		},
		score: { type: Number, default: 0, index: true }
	},
	{
		timestamps: {
			createdAt: true,
			updatedAt: false
		},
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
postSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Post", postSchema);