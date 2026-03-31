"use strict";

import { type AnyObject, Error, SchemaType, SchemaTypes } from "mongoose";
import { emptyString, urlRegExp } from "../library.ts";

SchemaTypes.Url = class Url extends SchemaType {
	constructor(key: string, options: AnyObject | undefined) {
		super(key, options, "Url");
	}

	cast(value: string) {
		if (!urlRegExp.test(value)) {
			throw new Error.CastError(this.constructor.name, value, emptyString);
		}
		return value;
	}
};