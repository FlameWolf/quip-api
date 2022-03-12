const mongoose = require("mongoose");
const ValidatorError = mongoose.Error.ValidatorError;

class PointSchemaType extends mongoose.SchemaType {
	constructor(key, options) {
		super(key, options, "Point");
	}

	cast(value) {
		const { type, coordinates } = value;
		if (!type) {
			throw new ValidatorError("Point", this.constructor.name, "point.type");
		}
		if (type !== "Point") {
			throw new ValidatorError(`Property "type" must be "Point"`);
		}
		if (!Array.isArray(coordinates)) {
			throw new ValidatorError(`Property "coordinates" must be an array`);
		}
		if (coordinates.length !== 2) {
			throw new ValidatorError(`Property "coordinates" should contain exactly two items`);
		}
		if (typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") {
			throw new ValidatorError("Both coordinates must be numbers");
		}
		if (coordinates[0] > 180 || coordinates[0] < -180) {
			throw new ValidatorError("Longitude must be within the range -180 to 180");
		}
		if (coordinates[1] > 90 || coordinates[1] < -90) {
			throw new ValidatorError("Latitude must be within the range -90 to 90");
		}
	}
}

module.exports = PointSchemaType;