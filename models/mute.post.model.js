"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const mutePostSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post" },
	mutedBy: { type: ObjectId, ref: "User", index: true }
});
mutePostSchema.index({ mutedBy: 1, post: 1 }, { unique: true, uniqueCaseInsensitive: true });
mutePostSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MutePost", mutePostSchema);