const mongoose = require("mongoose");
const ValidatorError = mongoose.Error.ValidatorError;
const isURL = require("validator/lib/isURL");

class UrlSchemaType extends mongoose.SchemaType {
	constructor(key, options) {
		super(key, options, "Url");
	}

	cast(value) {
		if (!isURL(value)) {
			throw new ValidatorError(`${value} is not a valid URL`, UrlSchemaType);
		}
		return value;
	}
}

module.exports = UrlSchemaType;