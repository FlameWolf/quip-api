"use strict";

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	try {
		const authToken = req.headers.authorization?.replace(/^bearer\s+/i, "");
		req.userInfo = authToken && jwt.verify(authToken, process.env.JWT_AUTH_SECRET);
	} catch (err) {}
	next();
};