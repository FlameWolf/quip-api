"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { contentLengthRegExp, maxMutedWordLength, escapeRegExp } = require("../library");

const mutedWordSchema = new mongoose.Schema(
	{
		word: {
			type: String,
			trim: true,
			required: true,
			set: value => escapeRegExp(value),
			validate: {
				validator: value => value.match(contentLengthRegExp).length <= maxMutedWordLength,
				message: "Word length exceeds the maximum allowed limit"
			},
			index: true
		},
		match: {
			type: String,
			enum: ["exact", "contains", "startsWith", "endsWith"],
			required: true,
			index: true
		},
		mutedBy: { type: ObjectId, ref: "User", required: true }
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
mutedWordSchema.index({ mutedBy: 1, word: 1, match: 1 }, { unique: true });
mutedWordSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MutedWord", mutedWordSchema);