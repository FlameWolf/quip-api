"use strict";

const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settings.controller");
const mutesController = require("../controllers/mutes.controller");
const usersController = require("../controllers/users.controller");
const followRequestsController = require("../controllers/follow-requests.controller");

router.post("/", settingsController.updateSettings);
router.get("/", settingsController.getSettings);
router.post("/mute", mutesController.muteWord);
router.post("/unmute", mutesController.unmuteWord);
router.get("/accept-req/:requestId", followRequestsController.acceptFollowRequest);
router.post("/accept-reqs", followRequestsController.acceptSelectedFollowRequests);
router.get("/accept-all-reqs", followRequestsController.acceptAllFollowRequests);
router.get("/reject-req/:requestId", followRequestsController.rejectFollowRequest);
router.post("/reject-reqs", followRequestsController.rejectSelectedFollowRequests);
router.get("/reject-all-reqs", followRequestsController.rejectAllFollowRequests);
router.get("/blocked", usersController.getBlocks);
router.get("/muted/users", usersController.getMutedUsers);
router.get("/muted/posts", usersController.getMutedPosts);
router.get("/muted/words", usersController.getMutedWords);
router.post("/update-email", usersController.updateEmail);
router.get("/deactivate", usersController.deactivateUser);
router.get("/activate", usersController.activateUser);
router.delete("/delete", usersController.deleteUser);
router.put("/:path", settingsController.updateSettingByPath);
router.get("/:path", settingsController.getSettingByPath);

module.exports = router;