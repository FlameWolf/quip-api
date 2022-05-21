"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { handleRegExp, passwordRegExp, emailRegExp } = require("../library");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
	{
		handle: {
			type: String,
			trim: true,
			required: true,
			unique: true,
			uniqueCaseInsensitive: true,
			validate: {
				validator: value => handleRegExp.test(value),
				message: "Handle is not valid"
			},
			index: true
		},
		password: {
			type: String,
			trim: true,
			required: true,
			validate: {
				validator: value => passwordRegExp.test(value),
				message: "Password is not valid"
			},
			select: false
		},
		email: {
			type: String,
			trim: true,
			validate: {
				validator: value => emailRegExp.test(value),
				message: "Email is not valid"
			},
			index: {
				partialFilterExpression: {
					email: {
						$exists: true,
						$ne: null
					}
				}
			}
		},
		pinnedPost: { type: ObjectId, ref: "Post" },
		protected: { type: Boolean, default: false },
		deactivated: { type: Boolean, default: false },
		deleted: { type: Boolean, default: false }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);