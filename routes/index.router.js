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
	res.status(404).send();
});
router.get("/timeline", requireAuthentication, indexController.timeline);
router.get("/activity/:period?", requireAuthentication, indexController.activity);
router.get("/topmost/:period?", indexController.topmost);
router.get("/hashtag/:name", indexController.hashtag);
router.get("/reject-email/:token", indexController.rejectEmail);
router.get("/verify-email/:token", indexController.verifyEmail);
router.post("/forgot-password", indexController.forgotPassword);
router.post("/reset-password/:token", indexController.resetPassword);

module.exports = router;