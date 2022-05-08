"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const mutedPostSchema = new mongoose.Schema(
	{
		post: { type: ObjectId, ref: "Post", required: true, index: true },
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
mutedPostSchema.index({ mutedBy: 1, post: 1 }, { unique: true });
mutedPostSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MutedPost", mutedPostSchema);