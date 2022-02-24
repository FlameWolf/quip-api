"use strict";

const { handleRegExp, passwordRegExp } = require("../library");
const mongoose = require("mongoose");
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
		isDeactivated: { type: Boolean, default: false },
		isDeleted: { type: Boolean, default: false }
	},
	{
		timestamps: true
	}
);
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);