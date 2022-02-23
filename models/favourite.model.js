"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const favouriteSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post", index: true },
	favouritedBy: { type: ObjectId, ref: "User" }
});
favouriteSchema.index({ favouritedBy: 1, post: 1 }, { unique: true, uniqueCaseInsensitive: true });
favouriteSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Favourite", favouriteSchema);