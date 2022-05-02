"use strict";

const express = require("express");
const router = express.Router();
const requireAuthentication = require("../middleware/require-authentication");
const postsController = require("../controllers/posts.controller");
const multerCloudStorageController = require("../controllers/multer-cloud-storage.controller");
const favouritesController = require("../controllers/favourites.controller");
const mutesController = require("../controllers/mutes.controller");

router.post("/create", requireAuthentication, multerCloudStorageController.uploadMediaFileToCloud, postsController.createPost);
router.get("/:postId", postsController.getPost);
router.get("/favourite/:postId", requireAuthentication, favouritesController.addFavourite);
router.get("/unfavourite/:postId", requireAuthentication, favouritesController.removeFavourite);
router.post("/quote/:postId", requireAuthentication, multerCloudStorageController.uploadMediaFileToCloud, postsController.quotePost);
router.get("/repeat/:postId", requireAuthentication, postsController.repeatPost);
router.get("/unrepeat/:postId", requireAuthentication, postsController.unrepeatPost);
router.post("/reply/:postId", requireAuthentication, multerCloudStorageController.uploadMediaFileToCloud, postsController.replyToPost);
router.get("/mute/:postId", requireAuthentication, mutesController.mutePost);
router.get("/unmute/:postId", requireAuthentication, mutesController.unmutePost);
router.delete("/delete/:postId", requireAuthentication, postsController.deletePost);

module.exports = router;