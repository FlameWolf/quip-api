"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const postsController = require("../controllers/posts.controller");
const multerCloudStorageController = require("../controllers/multer-cloud-storage.controller");
const favouritesController = require("../controllers/favourites.controller");
const mutesController = require("../controllers/mutes.controller");

router.post("/create", authenticateRequest, multerCloudStorageController.uploadMediaFileToCloud, postsController.createPost);
router.get("/:postId", postsController.getPost);
router.get("/favourite/:postId", authenticateRequest, favouritesController.addFavourite);
router.get("/unfavourite/:postId", authenticateRequest, favouritesController.removeFavourite);
router.get("/is-favourited/:postId", authenticateRequest, favouritesController.isFavourited);
router.post("/quote/:postId", authenticateRequest, multerCloudStorageController.uploadMediaFileToCloud, postsController.quotePost);
router.get("/repeat/:postId", authenticateRequest, postsController.repeatPost);
router.get("/unrepeat/:postId", authenticateRequest, postsController.unrepeatPost);
router.get("/is-repeated/:postId", authenticateRequest, postsController.isRepeated);
router.post("/reply/:postId", authenticateRequest, multerCloudStorageController.uploadMediaFileToCloud, postsController.replyToPost);
router.get("/mute/:postId", authenticateRequest, mutesController.mutePost);
router.get("/unmute/:postId", authenticateRequest, mutesController.unmutePost);
router.delete("/delete/:postId", authenticateRequest, postsController.deletePost);

module.exports = router;