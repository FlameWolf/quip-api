"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;
const settingsSchema = new Schema(
	{
		user: { type: ObjectId, ref: "User", index: true, unique: true },
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
		}),
		ui: new Schema({
			theme: {
				type: String,
				enum: ["light", "dark"],
				default: "light"
			},
			lang: {
				type: String
			}
		})
	},
	{
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
settingsSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Settings", settingsSchema);