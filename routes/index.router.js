"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const indexController = require("../controllers/index.controller");

router.get("/", indexController.home);
router.get("/timeline", authenticateRequest, indexController.timeline);
router.get("/topmost/:period?", indexController.topmost);

module.exports = router;