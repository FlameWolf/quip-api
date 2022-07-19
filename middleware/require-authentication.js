"use strict";

module.exports = async (req, res, next) => {
	if (!req.userInfo) {
		res.status(401).send();
		return;
	}
	next();
};