"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const favouriteSchema = new mongoose.Schema(
	{
		post: { type: ObjectId, ref: "Post", required: true, index: true },
		favouritedBy: { type: ObjectId, ref: "User", required: true }
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
favouriteSchema.index({ favouritedBy: 1, post: 1 }, { unique: true });
favouriteSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Favourite", favouriteSchema);