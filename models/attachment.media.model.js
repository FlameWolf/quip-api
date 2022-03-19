"use strict";

const mongoose = require("mongoose");

const attachmentMediaSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ["image", "video"],
		required: true
	},
	src: { type: mongoose.SchemaTypes.Url, required: true },
	previewSrc: { type: mongoose.SchemaTypes.Url },
	description: { type: String }
});

module.exports = mongoose.model("AttachmentMedia", attachmentMediaSchema);