"use strict";

import * as express from "express";
import * as settingsController from "../controllers/settings.controller";
import * as mutesController from "../controllers/mutes.controller";
import * as usersController from "../controllers/users.controller";
import * as followRequestsController from "../controllers/follow-requests.controller";

const router = express.Router();
router.use(require("../middleware/requireAuthentication"));
router.post("/", settingsController.updateSettings);
router.get("/", settingsController.getSettings);
router.post("/mute", mutesController.muteWord);
router.post("/unmute", mutesController.unmuteWord);
router.post("/sent-reqs", usersController.getUserFollowRequestsSent);
router.post("/received-reqs", usersController.getUserFollowRequestsReceived);
router.get("/accept-req/{:requestId}", followRequestsController.acceptFollowRequest);
router.post("/accept-reqs", followRequestsController.acceptSelectedFollowRequests);
router.get("/accept-all-reqs", followRequestsController.acceptAllFollowRequests);
router.get("/reject-req/{:requestId}", followRequestsController.rejectFollowRequest);
router.post("/reject-reqs", followRequestsController.rejectSelectedFollowRequests);
router.get("/reject-all-reqs", followRequestsController.rejectAllFollowRequests);
router.get("/blocked", usersController.getBlocks);
router.get("/muted/users", usersController.getMutedUsers);
router.get("/muted/posts", usersController.getMutedPosts);
router.get("/muted/words", usersController.getMutedWords);
router.get("/pin/{:postId}", usersController.pinPost);
router.get("/unpin", usersController.unpinPost);
router.post("/update-email", usersController.updateEmail);
router.post("/change-password", usersController.changePassword);
router.get("/deactivate", usersController.deactivateUser);
router.get("/activate", usersController.activateUser);
router.delete("/delete", usersController.deleteUser);
router.put("/{:path}", settingsController.updateSettingByPath);
router.get("/{:path}", settingsController.getSettingByPath);

module.exports = router;