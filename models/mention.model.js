"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const mentionSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post" },
	mentionedUser: { type: ObjectId, ref: "User" }
});

module.exports = mongoose.model("Mention", mentionSchema);