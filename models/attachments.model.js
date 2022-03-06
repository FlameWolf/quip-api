"use strict";

const mongoose = require("mongoose");
const Url = require("../schemaTypes/url.schema.type");

const attachmentsSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post" },
	url: { type: Url },
	image: { type: ObjectId, ref: "AttachmentMedia" },
	video: { type: ObjectId, ref: "AttachmentMedia" }
});

module.exports = mongoose.model("Attachments", attachmentsSchema);