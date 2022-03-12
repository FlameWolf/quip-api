const mongoose = require("mongoose");
const CastError = mongoose.Error.CastError;
const isURL = require("validator/lib/isURL");

class Url extends mongoose.SchemaType {
	constructor(key, options) {
		super(key, options, "Url");
	}

	cast(value) {
		if (!isURL(value)) {
			throw new CastError(this.constructor.name, value, "");
		}
		return value;
	}
}

module.exports = Url;