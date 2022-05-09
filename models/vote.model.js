"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const voteSchema = new mongoose.Schema(
	{
		poll: { type: ObjectId, ref: "", required: true, index: true },
		user: { type: ObjectId, ref: "", required: true },
		option: {
			type: String,
			enum: ["first", "second", "third", "fourth", "nota"],
			required: true
		}
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
voteSchema.index({ user: 1, poll: 1 }, { unique: true });
voteSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Vote", voteSchema);