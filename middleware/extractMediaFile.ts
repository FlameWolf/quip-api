"use strict";

import multer = require("multer");
import { validMimeTypes, megaByte } from "../library";

const extractMediaFile = multer({
	fileFilter: (req, file, cb) => {
		const [type, subtype] = file.mimetype.split("/");
		req.fileType = type.trim();
		req.fileSubtype = subtype.trim();
		const isValid = validMimeTypes.some(mimeType => mimeType === type);
		isValid ? cb(null, true) : cb(new Error("Invalid file type"));
	},
	limits: {
		fileSize: megaByte * 5
	},
	storage: multer.memoryStorage()
}).single("media");

module.exports = extractMediaFile;