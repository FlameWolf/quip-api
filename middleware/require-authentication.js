"use strict";

module.exports = async (req, res, next) => {
	if (!req.userInfo) {
		res.sendStatus(401);
		return;
	}
	next();
};