const multer = require("multer");
const path = require("path");
const validMimeTypes = ["image", "video"];
const { megaByte } = require("../library");

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
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, path.join("public", `${req.fileType}s`));
		},
		filename: (req, file, cb) => {
			cb(null, `${sanitise(file.originalname, 16)}_${Date.now().valueOf()}.${sanitise(req.fileSubtype, 8)}`);
		}
	})
});
const uploadMediaFile = extractMediaFile.single("media");

module.exports = { uploadMediaFile };