"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const mentionSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post", index: true },
	mentionedUser: { type: ObjectId, ref: "User", index: true }
});

module.exports = mongoose.model("Mention", mentionSchema);