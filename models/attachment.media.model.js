"use strict";

const mongoose = require("mongoose");
const Url = require("../schemaTypes/url.schema.type");

const attachmentMediaSchema = new mongoose.Schema({
	type: new mongoose.Schema({
		src: { type: Url, required: true },
		previewSrc: { type: Url }
	})
});

module.exports = mongoose.model("AttachmentMedia", attachmentMediaSchema);