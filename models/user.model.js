"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
	{
		handle: { type: String, trim: true, required: true, unique: true, uniqueCaseInsensitive: true },
		password: { type: String, trim: true, required: true, select: false },
		isDeactivated: { type: Boolean, default: false },
		isDeleted: { type: Boolean, default: false }
	},
	{
		timestamps: true
	}
);
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);