"use strict";

const multer = require("multer");
const cloudinary = require("cloudinary");
const { createCloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
const { megaByte } = require("../library");

const validMimeTypes = ["image", "video"];
const sanitise = (value, maxLength = undefined) => value.trim().substring(0, maxLength).replace(/\W/g, "_");
cloudinary.v2.config({
	cloud_name: process.env.CLOUD_BUCKET,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET
});
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
	storage: createCloudinaryStorage({
		cloudinary: cloudinary.v2,
		params: (req, file) => ({
			folder: `${req.fileType}s/`,
			public_id: `${sanitise(file.originalname.replace(/\.\w+$/, ""), 16)}_${Date.now().valueOf()}`
		})
	})
});
const uploadMediaFile = extractMediaFile.single("media");

module.exports = { uploadMediaFile };