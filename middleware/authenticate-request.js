"use strict";

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	const token = req.headers.authorization?.trim().replace(/^bearer\s+/i, "");
	if (!token) {
		res.status(401).json({
			message: "Request failed",
			error: "Authentication token not found"
		});
		return;
	}
	const payload = jwt.verify(token, process.env.JWT_SECRET);
	req.userInfo = payload;
	next();
};