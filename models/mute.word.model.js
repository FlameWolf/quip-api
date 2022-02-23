"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const muteWordSchema = new mongoose.Schema({
	word: { type: String, trim: true },
	match: { type: String, enum: ["exact", "contains", "startsWith", "endsWith"] },
	mutedBy: { type: ObjectId, ref: "User" }
});
muteWordSchema.index({ mutedBy: 1, word: 1, match: 1 }, { unique: true, uniqueCaseInsensitive: true });
muteWordSchema.plugin(uniqueValidator);

module.exports = mongoose.model("MuteWord", muteWordSchema);