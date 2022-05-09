"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { handleRegExp } = require("../library");

const listSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: true,
			validate: {
				validator: value => handleRegExp.test(value),
				message: "List name is not valid"
			}
		},
		owner: { type: ObjectId, ref: "User", required: true },
		includeRepeats: { type: Boolean, default: true },
		includeReplies: { type: Boolean, default: true }
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
listSchema.index({ owner: 1, name: 1 }, { unique: true });
listSchema.plugin(uniqueValidator);

module.exports = mongoose.model("List", listSchema);