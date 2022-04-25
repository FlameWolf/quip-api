"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const followSchema = new mongoose.Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		followedBy: { type: ObjectId, ref: "User", required: true }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
followSchema.index({ followedBy: 1, user: 1 }, { unique: true });
followSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Follow", followSchema);