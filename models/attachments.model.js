"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const attachmentsSchema = new mongoose.Schema(
	{
		post: { type: ObjectId, ref: "Post" },
		mediaFile: { type: ObjectId, ref: "MediaFile" }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);

module.exports = mongoose.model("Attachments", attachmentsSchema);