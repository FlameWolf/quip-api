"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const bookmarkSchema = new mongoose.Schema(
	{
		post: { type: ObjectId, ref: "Post", required: true, index: true },
		bookmarkedBy: { type: ObjectId, ref: "User", required: true }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
bookmarkSchema.index({ bookmarkedBy: 1, post: 1 }, { unique: true });
bookmarkSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Bookmark", bookmarkSchema);