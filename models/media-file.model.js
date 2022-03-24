"use strict";

const mongoose = require("mongoose");

const mediaFileSchema = new mongoose.Schema({
	fileType: {
		type: String,
		enum: ["image", "video"],
		required: true
	},
	src: { type: mongoose.SchemaTypes.Url, required: true },
	previewSrc: { type: mongoose.SchemaTypes.Url },
	description: { type: String }
});

module.exports = mongoose.model("MediaFile", mediaFileSchema);