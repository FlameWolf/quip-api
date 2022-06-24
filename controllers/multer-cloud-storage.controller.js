"use strict";

const multer = require("multer");
const multerCloudStorage = require("multer-cloud-storage");
const { megaByte } = require("../library");

const validMimeTypes = ["image", "video"];
const sanitise = (value, maxLength = undefined) => value.trim().substring(0, maxLength).replace(/\W/g, "_");
const extractMediaFile = multer({
	fileFilter: (req, file, cb) => {
		const [type, subtype] = file.mimetype.split("/");
		req.fileType = type;
		req.fileSubtype = subtype;
		const isValid = validMimeTypes.some(mimeType => mimeType === type);
		cb(isValid ? null : new Error("Invalid file type"), isValid);
	},
	limits: {
		fileSize: megaByte * 5
	},
	storage: multerCloudStorage.storageEngine({
		bucket: "quip-api-media",
		projectId: "quip-api",
		keyFilename: "google-credentials.json",
		uniformBucketLevelAccess: true,
		destination: (req, file, cb) => {
			cb(null, `${req.fileType}s/`);
		},
		filename: (req, file, cb) => {
			cb(null, `${sanitise(file.originalname, 16)}_${Date.now().valueOf()}.${sanitise(req.fileSubtype, 8)}`);
		}
	})
});
const uploadMediaFileToCloud = extractMediaFile.single("media");

module.exports = { uploadMediaFileToCloud };