"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const settingsSchema = new Schema({
	user: { type: ObjectId, ref: "User", index: true },
	timeline: new Schema({
		includeRepeats: { type: Boolean, default: true },
		includeReplies: { type: Boolean, default: true }
	}),
	activity: new Schema({
		period: {
			type: String,
			enum: ["day", "week", "month"],
			default: "day"
		}
	}),
	topmost: new Schema({
		period: {
			type: String,
			enum: ["day", "week", "month", "year", "all"],
			default: "day"
		}
	}),
	profile: new Schema({
		includeRepeats: { type: Boolean, default: false },
		includeReplies: { type: Boolean, default: false }
	})
});

module.exports = mongoose.model("Settings", settingsSchema);