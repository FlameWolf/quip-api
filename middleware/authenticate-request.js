"use strict";

const jwt = require("jsonwebtoken");
const { TokenExpiredError } = jwt;

module.exports = (req, res, next) => {
	try {
		const authToken = req.headers.authorization?.replace(/^bearer\s+/i, "");
		if (!authToken) {
			throw new Error("Authentication token not found");
		}
		req.userInfo = jwt.verify(authToken, process.env.JWT_AUTH_SECRET);
	} catch (err) {
		res.status(401).send(err instanceof TokenExpiredError ? "Authentication token expired" : err);
		return;
	}
	next();
};