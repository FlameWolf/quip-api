"use strict";

const express = require("express");
const router = express.Router();
const requireAuthentication = require("../middleware/require-authentication");
const indexController = require("../controllers/index.controller");

router.get("/", async (req, res, next) => {
	if (process.env.NODE_ENV !== "production") {
		res.redirect("/api-docs/v3");
		return;
	}
	res.sendStatus(404);
});
router.get("/timeline", requireAuthentication, indexController.timeline);
router.get("/activity/:period?", requireAuthentication, indexController.activity);
router.get("/topmost/:period?", indexController.topmost);
router.get("/verify-email/:token", indexController.verifyEmail);

module.exports = router;