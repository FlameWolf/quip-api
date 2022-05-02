"use strict";

module.exports = (req, res, next) => {
	if (!req.userInfo) {
		res.sendStatus(401);
		return;
	}
	next();
};