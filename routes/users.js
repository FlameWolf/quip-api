"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const usersController = require("../controllers/users.controller");
const followsController = require("../controllers/follows.controller");
const mutesController = require("../controllers/mutes.controller");

router.get("/:handle", usersController.getUser);
router.get("/:handle/profile", usersController.getUserProfile);
router.get("/follow/:handle", authenticateRequest, followsController.followUser);
router.get("/unfollow/:handle", authenticateRequest, followsController.unfollowUser);
router.get("/mute/:handle", authenticateRequest, mutesController.muteUser);
router.get("/unmute/:handle", authenticateRequest, mutesController.unmuteUser);
router.get("/block/:handle", authenticateRequest, usersController.blockUser);
router.get("/unblock/:handle", authenticateRequest, usersController.unblockUser);

module.exports = router;