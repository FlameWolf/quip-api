"use strict";

const multer = require("multer");
const { megaByte } = require("../library");

const validMimeTypes = ["image", "video"];
const factory = multer({
	fileFilter: (req, file, cb) => {
		const [type, subtype] = file.mimetype.split("/");
		req.fileType = type.trim();
		req.fileSubtype = subtype.trim();
		const isValid = validMimeTypes.some(mimeType => mimeType === type);
		cb(isValid ? null : new Error("Invalid file type"), isValid);
	},
	limits: {
		fileSize: megaByte * 5
	},
	storage: multer.memoryStorage()
});
const extractMediaFile = factory.single("media");
const sanitiseFileName = (value, maxLength = undefined) => value.trim().substring(0, maxLength).replace(/\W/g, "_");

module.exports = { extractMediaFile, sanitiseFileName };