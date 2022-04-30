"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const usersController = require("../controllers/users.controller");
const followsController = require("../controllers/follows.controller");
const mutesController = require("../controllers/mutes.controller");
const blocksController = require("../controllers/blocks.controller");

router.get("/:handle", usersController.getUser);
router.get("/:handle/posts", usersController.getUserPosts);
router.get("/:handle/favourites", usersController.getUserFavourites);
router.get("/:handle/following", usersController.getUserFollowing);
router.get("/:handle/followers", usersController.getUserFollowers);
router.get("/:handle/mentions", usersController.getUserMentions);
router.get("/follow/:handle", authenticateRequest, followsController.followUser);
router.get("/unfollow/:handle", authenticateRequest, followsController.unfollowUser);
router.get("/mute/:handle", authenticateRequest, mutesController.muteUser);
router.get("/unmute/:handle", authenticateRequest, mutesController.unmuteUser);
router.get("/block/:handle", authenticateRequest, blocksController.blockUser);
router.get("/unblock/:handle", authenticateRequest, blocksController.unblockUser);

module.exports = router;