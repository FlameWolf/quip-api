"use strict";

if (!Array.prototype.at) {
	Array.prototype.at = function (index) {
		return this[index < 0 ? this.length + index : index];
	};
}
if (!Object.prototype.setProperty) {
	const setProperty = (operand, path, value) => {
		const segments = Array.isArray(path) ? path : path.split(".");
		operand = operand || {};
		if (segments.length > 1) {
			const segment = segments.shift();
			operand[segment] = operand[segment] || {};
			setProperty(operand[segment], segments, value);
		} else {
			operand[segments.pop()] = value;
		}
	};
	Object.prototype.setProperty = setProperty;
}
if (!Object.prototype.getProperty) {
	const getProperty = (operand, path) => {
		const segments = Array.isArray(path) ? path : path.split(".");
		if (operand && segments.length) {
			return getProperty(operand[segments.shift()], segments);
		}
		return operand;
	};
	Object.prototype.getProperty = getProperty;
}