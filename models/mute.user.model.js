"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const muteUserSchema = new mongoose.Schema({
	user: { type: ObjectId, ref: "User", required: true },
	mutedBy: { type: ObjectId, ref: "User", required: true }
});
muteUserSchema.index({ mutedBy: 1, user: 1 }, { unique: true, uniqueCaseInsensitive: true });
muteUserSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MuteUser", muteUserSchema);