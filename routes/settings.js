"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const mutesController = require("../controllers/mutes.controller");
const settingsController = require("../controllers/settings.controller");

router.post("/mute", authenticateRequest, mutesController.muteWord);
router.post("/unmute", authenticateRequest, mutesController.unmuteWord);
router.get("/deactivate", authenticateRequest, settingsController.deactivateUser);
router.get("/activate", authenticateRequest, settingsController.activateUser);
router.get("/delete", authenticateRequest, settingsController.deleteUser);

module.exports = router;