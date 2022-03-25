"use strict";

const mongoose = require("mongoose");

const mediaFileSchema = new mongoose.Schema(
	{
		fileType: {
			type: String,
			enum: ["image", "video"],
			required: true
		},
		src: { type: mongoose.SchemaTypes.Url, required: true },
		previewSrc: { type: mongoose.SchemaTypes.Url },
		description: {
			type: String,
			text: true,
			index: {
				partialFilterExpression: {
					description: {
						$exists: true,
						$ne: null
					}
				}
			}
		}
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);

module.exports = mongoose.model("MediaFile", mediaFileSchema);