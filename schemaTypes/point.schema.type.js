const mongoose = require("mongoose");
const ValidatorError = mongoose.Error.ValidatorError;
const { validateCoordinates } = require("../library");

class PointSchemaType extends mongoose.SchemaType {
	constructor(key, options) {
		super(key, options, "Point");
	}

	cast(value) {
		if (!value.type) {
			throw new ValidatorError("Point", value.type, "point.type");
		}
		if (value.type !== "Point") {
			throw new ValidatorError(`${value.type} is not a valid GeoJSON type`);
		}
		validateCoordinates(value.coordinates, ValidatorError);
		return value;
	}
}

module.exports = PointSchemaType;