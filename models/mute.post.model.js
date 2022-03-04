"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const mutePostSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post", required: true },
	mutedBy: { type: ObjectId, ref: "User", required: true }
});
mutePostSchema.index({ mutedBy: 1, post: 1 }, { unique: true, uniqueCaseInsensitive: true });
mutePostSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MutePost", mutePostSchema);