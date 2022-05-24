"use strict";

const mongoose = require("mongoose");
const CastError = mongoose.Error.CastError;
const NativeError = mongoose.NativeError;

class Point extends mongoose.SchemaType {
	constructor(key, options) {
		super(key, options, "Point");
	}

	cast(value) {
		const { type, coordinates } = value;
		const [longitude, latitude] = coordinates;
		if (!type) {
			throw new CastError(this.constructor.name, value, "type");
		}
		if (!coordinates) {
			throw new CastError(this.constructor.name, value, "coordinates");
		}
		if (type !== "Point") {
			throw new CastError(this.constructor.name, value, "type", new NativeError(`Property "type" must be equal to "Point"`));
		}
		if (!Array.isArray(coordinates)) {
			throw new CastError(this.constructor.name, value, "coordinates", new NativeError(`Property "coordinates" must be an array`));
		}
		if (coordinates.length !== 2) {
			throw new CastError(this.constructor.name, value, "coordinates", new NativeError(`Property "coordinates" should contain exactly two items`));
		}
		if (typeof longitude !== "number" || typeof latitude !== "number") {
			throw new CastError(this.constructor.name, value, "coordinates", new NativeError("Both coordinates must be numbers"));
		}
		if (longitude > 180 || longitude < -180) {
			throw new CastError(this.constructor.name, value, "coordinates", new NativeError("Longitude must be within the range -180 to 180"));
		}
		if (latitude > 90 || latitude < -90) {
			throw new CastError(this.constructor.name, value, "coordinates", new NativeError("Latitude must be within the range -90 to 90"));
		}
		return { type, coordinates };
	}
}

mongoose.SchemaTypes.Point = Point;