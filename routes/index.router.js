"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const indexController = require("../controllers/index.controller");

router.get("/", async (req, res, next) => {
	if (process.env.NODE_ENV !== "production") {
		res.redirect("/api-docs/v3");
		return;
	}
	res.sendStatus(404);
});
router.get("/timeline", authenticateRequest, indexController.timeline);
router.get("/topmost/:period?", authenticateRequest, indexController.topmost);

module.exports = router;