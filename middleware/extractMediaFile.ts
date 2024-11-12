"use strict";

import * as multer from "multer";
import * as path from "path";
import { validMimeTypes, megaByte, standardiseFileName } from "../library";

const extractMediaFile = multer({
	fileFilter: (req, file, cb) => {
		[file.type, file.subType] = file.mimetype.split("/");
		const isValid = validMimeTypes.some(mimeType => mimeType === file.type);
		isValid ? cb(null, true) : cb(new Error("Invalid file type"));
	},
	limits: {
		fileSize: megaByte * 5
	},
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, path.join("public", `${file.type}s`));
		},
		filename: (req, file, cb) => {
			cb(null, standardiseFileName(file.originalname));
		}
	})
}).single("media");

module.exports = extractMediaFile;