"use strict";

const express = require("express");
const router = express.Router();
const indexController = require("../controllers/index.controller");

router.get("/", indexController.home);
router.get("/timeline", indexController.timeline);
router.get("/timeline/top", indexController.timelineTop);

module.exports = router;