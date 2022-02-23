"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const muteWordSchema = new mongoose.Schema({
	word: {
		type: new mongoose.Schema({
			word: { type: String, trim: true },
			match: { type: String, enum: ["exact", "contains", "startsWith", "endsWith"] }
		}),
		index: true
	},
	mutedBy: { type: ObjectId, ref: "User", index: true }
});
muteWordSchema.index({ word: 1, mutedBy: 1 }, { unique: true, uniqueCaseInsensitive: true });
muteWordSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MuteWord", muteWordSchema);