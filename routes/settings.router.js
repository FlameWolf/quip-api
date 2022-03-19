"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const mutesController = require("../controllers/mutes.controller");
const usersController = require("../controllers/users.controller");
const followRequestsController = require("../controllers/follow-requests.controller");

router.post("/mute", authenticateRequest, mutesController.muteWord);
router.post("/unmute", authenticateRequest, mutesController.unmuteWord);
router.get("/accept_req/{requestId}", authenticateRequest, followRequestsController.acceptFollowRequest);
router.post("/accept_reqs", authenticateRequest, followRequestsController.acceptSelectedFollowRequests);
router.get("/accept_all_reqs", authenticateRequest, followRequestsController.acceptAllFollowRequests);
router.get("/reject_req/{requestId}", authenticateRequest, followRequestsController.rejectFollowRequest);
router.post("/reject_reqs", authenticateRequest, followRequestsController.rejectSelectedFollowRequests);
router.get("/reject_all_reqs", authenticateRequest, followRequestsController.rejectAllFollowRequests);
router.get("/deactivate", authenticateRequest, usersController.deactivateUser);
router.get("/activate", authenticateRequest, usersController.activateUser);
router.get("/delete", authenticateRequest, usersController.deleteUser);

module.exports = router;