if (!Array.prototype.at) {
	Array.prototype.at = function (index) {
		return this[this.length + index];
	};
}