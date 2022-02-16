"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const userController = require("../controllers/user.controller");

router.get("/:handle", userController.getUser);
router.get("/:handle/profile", userController.getUserProfile);
router.get("/follow/:handle", authenticateRequest, userController.followUser);
router.get("/unfollow/:handle", authenticateRequest, userController.unfollowUser);
router.get("/mute/:handle", authenticateRequest, userController.muteUser);
router.get("/unmute/:handle", authenticateRequest, userController.unmuteUser);
router.get("/block/:handle", authenticateRequest, userController.blockUser);
router.get("/unblock/:handle", authenticateRequest, userController.unblockUser);

module.exports = router;