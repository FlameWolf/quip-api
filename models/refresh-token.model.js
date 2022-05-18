"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		token: { type: String, required: true, max: 512 },
		lastUsed: { type: Date, default: new Date() }
	},
	{
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
refreshTokenSchema.index({ token: 1, user: 1 });
refreshTokenSchema.index({ lastUsed: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);