"use strict";

exports.default = async (req, res, next) => {
	if (!req.userInfo) {
		res.status(401).send();
		return;
	}
	next();
};