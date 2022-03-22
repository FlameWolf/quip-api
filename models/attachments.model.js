"use strict";

const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const attachmentsSchema = new mongoose.Schema({
	post: { type: ObjectId, ref: "Post" },
	url: { type: mongoose.SchemaTypes.Url },
	mediaFile: { type: ObjectId, ref: "MediaFile" }
});

module.exports = mongoose.model("Attachments", attachmentsSchema);