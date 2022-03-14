"use strict";

const { handleRegExp, passwordRegExp } = require("../library");
const mongoose = require("mongoose");
const isEmail = require("validator/lib/isEmail");
const uniqueValidator = require("mongoose-unique-validator");
const { ObjectId } = require("mongodb");

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
			}
		},
		password: {
			type: String,
			trim: true,
			required: true,
			select: false,
			validate: {
				validator: value => passwordRegExp.test(value),
				message: "Password is not valid"
			}
		},
		email: {
			type: String,
			trim: true,
			validate: {
				validator: value => isEmail(value),
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
		emailVerified: { type: Boolean },
		pinnedPost: { type: ObjectId, ref: "Post" },
		protected: { type: Boolean },
		deactivated: { type: Boolean },
		deleted: { type: Boolean }
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