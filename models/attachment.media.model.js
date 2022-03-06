"use strict";

const mongoose = require("mongoose");

const attachmentMediaSchema = new mongoose.Schema({
	type: new mongoose.Schema({
		src: { type: String, required: true },
		previewSrc: { type: String }
	})
});

module.exports = mongoose.model("AttachmentMedia", attachmentMediaSchema);