"use strict";

const { publicRoutes, jwtSecret } = require("../library");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	const token = req.headers.authorization?.trim().replace(/^bearer\s+/i, "");
	if (!token) {
		return res.status(401).json({
			message: "Request failed",
			error: "Authentication token not found"
		});
	}
	const payload = jwt.verify(token, jwtSecret);
	req.userInfo = payload;
	next();
};