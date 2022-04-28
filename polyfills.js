"use strict";

if (!Array.prototype.at) {
	Array.prototype.at = function (index) {
		return this[index < 0 ? this.length + index : index];
	};
}