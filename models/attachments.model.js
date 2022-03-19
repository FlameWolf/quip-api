"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const attachmentsSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post" },
	url: { type: mongoose.SchemaTypes.Url },
	media: { type: ObjectId, ref: "AttachmentMedia" }
});

module.exports = mongoose.model("Attachments", attachmentsSchema);