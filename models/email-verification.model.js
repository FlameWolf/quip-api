"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { emailRegExp } = require("../library");

const emailVerificationSchema = new mongoose.Schema(
	{
		user: { type: ObjectId, ref: "User", required: true, index: true },
		email: {
			type: String,
			trim: true,
			validate: {
				validator: value => emailRegExp.test(value),
				message: "Email is not valid"
			}
		},
		previousEmail: { type: String },
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
emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);