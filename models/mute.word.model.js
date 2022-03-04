"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const muteWordSchema = new mongoose.Schema({
	word: { type: String, trim: true, required: true },
	match: { type: String, enum: ["exact", "contains", "startsWith", "endsWith"], required: true },
	mutedBy: { type: ObjectId, ref: "User", required: true }
});
muteWordSchema.index({ mutedBy: 1, word: 1, match: 1 }, { unique: true, uniqueCaseInsensitive: true });
muteWordSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MuteWord", muteWordSchema);