"use strict";

const multer = require("multer");
const { validMimeTypes, megaByte } = require("../library");

exports.default = multer({
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
}).single("media");