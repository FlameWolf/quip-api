"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const MediaFile = require("./media-file.model");

const attachmentsSchema = new mongoose.Schema(
	{
		post: { type: ObjectId, ref: "Post" },
		mediaFile: { type: ObjectId, ref: "MediaFile" }
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
attachmentsSchema.post("findOneAndDelete", async attachments => {
	const mediaFileId = attachments?.mediaFile;
	if (mediaFileId) {
		await MediaFile.findByIdAndDelete(mediaFileId);
	}
});

module.exports = mongoose.model("Attachments", attachmentsSchema);