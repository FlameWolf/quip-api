"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const mutePostSchema = new mongoose.Schema(
	{
		post: { type: ObjectId, ref: "Post", index: true },
		mutedBy: { type: ObjectId, ref: "User", index: true }
	}
);
mutePostSchema.index({ post: 1, mutedBy: 1 }, { unique: true, uniqueCaseInsensitive: true });
mutePostSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MutePost", mutePostSchema);