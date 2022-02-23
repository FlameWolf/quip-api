"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const muteUserSchema = new mongoose.Schema({
	user: { type: ObjectId, ref: "User" },
	mutedBy: { type: ObjectId, ref: "User", index: true }
});
muteUserSchema.index({ user: 1, mutedBy: 1 }, { unique: true, uniqueCaseInsensitive: true });
muteUserSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MuteUser", muteUserSchema);