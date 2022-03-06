const multer = require("multer");

const validMimeTypes = ["image/", "video/"];
const isMimeTypeValid = mimeType => validMimeTypes.some(x => mimeType.startsWith(x));
const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		let error = null;
		if (!isMimeTypeValid(file.mimetype)) {
			error = new Error("Invalid file type");
		}
		callback(error, "media");
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