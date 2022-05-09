"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const listMemberSchema = new mongoose.Schema(
	{
		list: { type: ObjectId, ref: "List", required: true, index: true },
		user: { type: ObjectId, ref: "User", required: true }
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
listMemberSchema.index({ user: 1, list: 1 }, { unique: true });
listMemberSchema.plugin(uniqueValidator);

module.exports = mongoose.model("ListMember", listMemberSchema);