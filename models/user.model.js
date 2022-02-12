"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema(
	{
		handle: { type: String, trim: true, required: true, unique: true },
		password: { type: String, trim: true, required: true, select: false },
		posts: [{ type: ObjectId, ref: "Post" }],
		favourites: [{ type: ObjectId, ref: "Post" }],
		following: [{ type: ObjectId, ref: "User" }],
		followers: [{ type: ObjectId, ref: "User" }]
	},
	{
		timestamps: true
	}
);
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);