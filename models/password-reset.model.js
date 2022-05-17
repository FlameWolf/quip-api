"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		token: { type: ObjectId, required: true }
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
passwordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model("PasswordReset", passwordResetSchema);