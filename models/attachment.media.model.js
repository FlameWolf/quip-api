"use strict";

const mongoose = require("mongoose");

const attachmentMediaSchema = new mongoose.Schema({
	type: new mongoose.Schema({
		src: { type: mongoose.SchemaTypes.Url, required: true },
		previewSrc: { type: mongoose.SchemaTypes.Url }
	})
});

module.exports = mongoose.model("AttachmentMedia", attachmentMediaSchema);