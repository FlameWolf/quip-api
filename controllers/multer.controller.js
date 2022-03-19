const multer = require("multer");
const path = require("path");
const { mimeTypeMap, mapMimeType } = require("../library");

const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		const mapEntry = mapMimeType(file.mimetype);
		callback(mapEntry ? null : new Error("Invalid file type"), path.join("public", mapEntry.path));
	},
	filename: (req, file, callback) => {
		let fileName = file.originalname
			.trim()
			.replace(/\W+(?=.*\.[^.]*$)/g, "-")
			.replace(/\.\w+$/, "");
		callback(null, `${fileName}-${Date.now().valueOf()}.${file.mimetype.split("/")[1]}`);
	}
});

exports.extractMediaFile = multer({ storage });