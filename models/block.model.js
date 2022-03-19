"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const blockSchema = new mongoose.Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		blockedBy: { type: ObjectId, ref: "User", required: true }
	},
	{
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
blockSchema.index({ blockedBy: 1, user: 1 }, { unique: true });
blockSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Block", blockSchema);