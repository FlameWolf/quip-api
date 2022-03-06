const multer = require("multer");

const mimeTypeMap = [
	{
		mimeType: "image/",
		path: "images"
	},
	{
		mimeType: "video/",
		path: "videos"
	}
];
const mapMimeType = mimeType => mimeTypeMap.find(value => mimeType.startsWith(value.mimeType));
const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		const mapEntry = mapMimeType(file.mimetype);
		callback(mapEntry ? null : new Error("Invalid file type"), mapEntry.path);
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