"use strict";

import multer = require("multer");
import * as path from "path";
import { validMimeTypes, megaByte, sanitiseFileName } from "../library";

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
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, path.join("public", `${req.fileType}s`));
		},
		filename: (req, file, cb) => {
			cb(null, `${sanitiseFileName(file.originalname.replace(new RegExp(`\.${req.fileSubtype as string}$`), ""), 16)}_${Date.now().valueOf()}`);
		}
	})
}).single("media");

module.exports = extractMediaFile;