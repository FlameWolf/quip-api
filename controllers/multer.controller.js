const multer = require("multer");

const validMimeTypes = ["image/", "video/"];
const isMimeTypeValid = mimeType => validMimeTypes.some(x => mimeType.startsWith(x));
const storage = multer.diskStorage({
	destination: (req, file, callbackFn) => {
		let error = null;
		if (!isMimeTypeValid(file.mimetype)) {
			error = new Error("Invalid file type");
		}
		callbackFn(error, "media");
	},
	filename: (httpRequest, file, callbackFn) => {
		let fileName = file.originalname
			.trim()
			.replace(/\W+(?=.*\.[^.]*$)/g, "-")
			.replace(/\.\w+$/, "");
		callbackFn(null, `${fileName}-${Date.now().valueOf()}.${file.mimetype.split("/")[1]}`);
	}
});

exports.extractMediaFile = multer({ storage });