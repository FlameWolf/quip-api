"use strict";

const express = require("express");
const router = express.Router();
const requireAuthentication = require("../middleware/require-authentication");
const usersController = require("../controllers/users.controller");
const followsController = require("../controllers/follows.controller");
const followRequestsController = require("../controllers/follow-requests.controller");
const mutesController = require("../controllers/mutes.controller");
const blocksController = require("../controllers/blocks.controller");

router.get("/follow/:handle", requireAuthentication, followsController.followUser);
router.get("/cancel-req/:handle", requireAuthentication, followRequestsController.cancelFollowRequest);
router.get("/unfollow/:handle", requireAuthentication, followsController.unfollowUser);
router.get("/mute/:handle", requireAuthentication, mutesController.muteUser);
router.get("/unmute/:handle", requireAuthentication, mutesController.unmuteUser);
router.get("/block/:handle", requireAuthentication, blocksController.blockUser);
router.get("/unblock/:handle", requireAuthentication, blocksController.unblockUser);
router.get("/:handle", usersController.getUser);
router.get("/:handle/posts", usersController.getUserPosts);
router.get("/:handle/topmost/:period?", usersController.getUserTopmost);
router.get("/:handle/favourites", requireAuthentication, usersController.getUserFavourites);
router.get("/:handle/votes", requireAuthentication, usersController.getUserVotes);
router.get("/:handle/bookmarks", requireAuthentication, usersController.getUserBookmarks);
router.get("/:handle/following", requireAuthentication, usersController.getUserFollowing);
router.get("/:handle/followers", requireAuthentication, usersController.getUserFollowers);
router.get("/:handle/mentions", usersController.getUserMentions);

module.exports = router;