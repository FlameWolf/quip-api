const mongoose = require("mongoose");
const CastError = mongoose.Error.CastError;
const { urlRegExp } = require("../library");

class Url extends mongoose.SchemaType {
	constructor(key, options) {
		super(key, options, "Url");
	}

	cast(value) {
		if (!urlRegExp.test(value)) {
			throw new CastError(this.constructor.name, value, "");
		}
		return value;
	}
}

mongoose.SchemaTypes.Url = Url;