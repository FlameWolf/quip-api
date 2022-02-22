"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const followSchema = new mongoose.Schema(
	{
		user: { type: ObjectId, ref: "User" },
		followedBy: { type: ObjectId, ref: "User" }
	},
	{
		timestamps: true
	}
);
followSchema.index({ user: 1, followedBy: 1 }, { unique: true, uniqueCaseInsensitive: true });
followSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Follow", followSchema);