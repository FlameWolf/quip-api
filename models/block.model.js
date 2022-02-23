"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const blockSchema = new mongoose.Schema({
	user: { type: ObjectId, ref: "User" },
	blockedBy: { type: ObjectId, ref: "User", index: true }
});
blockSchema.index({ user: 1, blockedBy: 1 }, { unique: true, uniqueCaseInsensitive: true });
blockSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Block", blockSchema);