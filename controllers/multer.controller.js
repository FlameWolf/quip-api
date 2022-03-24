const multer = require("multer");
const path = require("path");
const validMimeTypes = ["image", "video"];
const { megaByte } = require("../library");

const sanitise = (value, maxLength = undefined) =>
	value
		.trim()
		.substring(0, maxLength)
		.replace(/\W+(?=.*\.[^.]*$)/g, "_")
		.replace(/\.\w+$/, "");

exports.extractMediaFile = multer({
	fileFilter: (req, file, cb) => {
		const [type, subtype] = file.mimetype.split("/");
		req.fileType = type;
		req.fileSubtype = subtype;
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
			cb(null, `${sanitise(file.originalname, 16)}_${Date.now().valueOf()}.${sanitise(req.fileSubtype, 8)}`);
		}
	})
});