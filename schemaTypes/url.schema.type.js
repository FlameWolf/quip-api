const mongoose = require("mongoose");
const isURL = require("validator/lib/isURL");

class UrlSchemaType extends mongoose.SchemaType {
	constructor(key, options) {
		super(key, options, "Url");
	}

	cast(value) {
		if (!isURL(value)) {
			throw new Error(`Url: "${value}" is not a valid URL`);
		}
		return value;
	}
}

module.exports = UrlSchemaType;