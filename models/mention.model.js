"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const mentionSchema = new mongoose.Schema(
	{
		post: { type: ObjectId, ref: "Post", index: true },
		mentioned: { type: ObjectId, ref: "User", index: true }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);

module.exports = mongoose.model("Mention", mentionSchema);