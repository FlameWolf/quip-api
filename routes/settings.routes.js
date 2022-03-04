"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const mutesController = require("../controllers/mutes.controller");
const usersController = require("../controllers/users.controller");

router.post("/mute", authenticateRequest, mutesController.muteWord);
router.post("/unmute", authenticateRequest, mutesController.unmuteWord);
router.get("/deactivate", authenticateRequest, usersController.deactivateUser);
router.get("/activate", authenticateRequest, usersController.activateUser);
router.get("/delete", authenticateRequest, usersController.deleteUser);

module.exports = router;