"use strict";

import { RequestHandler } from "express-serve-static-core";

const requireAuthentication: RequestHandler = (req, res, next) => {
	if (!req.userInfo) {
		res.status(401).send();
		return;
	}
	next();
};

module.exports = requireAuthentication;