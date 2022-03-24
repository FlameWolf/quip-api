"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const { maxMentionsCount } = require("../library");

const mentionSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post" },
	mentions: {
		type: [
			{
				type: ObjectId,
				ref: "User"
			}
		],
		validate: {
			validator: value => value.length <= maxMentionsCount,
			message: "Maximum number of mentions exceeded"
		}
	}
});

module.exports = mongoose.model("Mention", mentionSchema);