"use strict";

const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const mutesController = require("../controllers/mutes.controller");
const usersController = require("../controllers/users.controller");
const followRequestsController = require("../controllers/follow-requests.controller");

router.post("/", settingsController.updateSettings);
router.put("/:path", settingsController.updateSettingByPath);
router.get("/", settingsController.getSettings);
router.get("/:path", settingsController.getSettingByPath);
router.post("/mute", mutesController.muteWord);
router.post("/unmute", mutesController.unmuteWord);
router.get("/accept_req/:requestId", followRequestsController.acceptFollowRequest);
router.post("/accept_reqs", followRequestsController.acceptSelectedFollowRequests);
router.get("/accept_all_reqs", followRequestsController.acceptAllFollowRequests);
router.get("/reject_req/:requestId", followRequestsController.rejectFollowRequest);
router.post("/reject_reqs", followRequestsController.rejectSelectedFollowRequests);
router.get("/reject_all_reqs", followRequestsController.rejectAllFollowRequests);
router.get("/blocked", usersController.getBlocks);
router.get("/muted/users", usersController.getMutedUsers);
router.get("/muted/posts", usersController.getMutedPosts);
router.get("/muted/words", usersController.getMutedWords);
router.get("/deactivate", usersController.deactivateUser);
router.get("/activate", usersController.activateUser);
router.delete("/delete", usersController.deleteUser);

module.exports = router;