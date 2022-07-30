"use strict";

import * as express from "express";
import * as usersController from "../controllers/users.controller";
import * as followsController from "../controllers/follows.controller";
import * as followRequestsController from "../controllers/follow-requests.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as blocksController from "../controllers/blocks.controller";

const requireAuthentication = require("../middleware/requireAuthentication");
const router = express.Router();
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