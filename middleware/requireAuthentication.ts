"use strict";

import type { RequestHandler } from "express-serve-static-core";

const requireAuthentication: RequestHandler = (req, res, next) => {
	if (!req.userInfo) {
		res.status(401).send();
		return;
	}
	next();
};

export default requireAuthentication;