"use strict";

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	try {
		const authToken = req.headers.authorization?.replace(/^bearer\s+/i, "");
		req.userInfo = jwt.verify(authToken, process.env.JWT_AUTH_SECRET);
	} catch (err) {
		res.status(401).send(err);
		return;
	}
	next();
};