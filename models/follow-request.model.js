"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const followRequestSchema = new mongoose.Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		requestedBy: { type: ObjectId, ref: "User", required: true }
	},
	{
		timestamps: {
			createdAt: true,
			updatedAt: false
		},
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
followRequestSchema.index({ user: 1, requestedBy: 1 }, { unique: true });
followRequestSchema.plugin(uniqueValidator);

module.exports = mongoose.model("FollowRequest", followRequestSchema);