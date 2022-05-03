"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { contentLengthRegExp, maxMutedWordLength } = require("../library");

const mutedWordSchema = new mongoose.Schema(
	{
		word: {
			type: String,
			trim: true,
			required: true,
			validate: {
				validator: value => value.match(contentLengthRegExp).length <= maxMutedWordLength,
				message: "Word length exceeds the maximum allowed limit"
			}
		},
		match: { type: String, enum: ["exact", "contains", "startsWith", "endsWith"], required: true },
		mutedBy: { type: ObjectId, ref: "User", required: true }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
mutedWordSchema.index({ mutedBy: 1, word: 1, match: 1 }, { unique: true });
mutedWordSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MutedWord", mutedWordSchema);