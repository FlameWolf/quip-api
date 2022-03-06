"use strict";

const mongoose = require("mongoose");

const attachmentsSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post" },
	url: { type: String },
	image: { type: ObjectId, ref: "AttachmentMedia" },
	video: { type: ObjectId, ref: "AttachmentMedia" }
});

module.exports = mongoose.model("Attachments", attachmentsSchema);