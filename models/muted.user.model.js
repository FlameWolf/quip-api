"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const mutedUserSchema = new mongoose.Schema({
	user: { type: ObjectId, ref: "User", required: true },
	mutedBy: { type: ObjectId, ref: "User", required: true }
});
mutedUserSchema.index({ mutedBy: 1, user: 1 }, { unique: true, uniqueCaseInsensitive: true });
mutedUserSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MutedUser", mutedUserSchema);