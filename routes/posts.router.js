"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const postsController = require("../controllers/posts.controller");
const multerController = require("../controllers/multer.controller");
const favouritesController = require("../controllers/favourites.controller");
const mutesController = require("../controllers/mutes.controller");

router.post("/create", authenticateRequest, multerController.extractMediaFile.single("media"), postsController.createPost);
router.get("/:postId", postsController.getPost);
router.get("/favourite/:postId", authenticateRequest, favouritesController.addFavourite);
router.get("/unfavourite/:postId", authenticateRequest, favouritesController.removeFavourite);
router.post("/quote/:postId", authenticateRequest, multerController.extractMediaFile.single("media"), postsController.quotePost);
router.get("/repeat/:postId", authenticateRequest, postsController.repeatPost);
router.get("/unrepeat/:postId", authenticateRequest, postsController.unrepeatPost);
router.post("/reply/:postId", authenticateRequest, multerController.extractMediaFile.single("media"), postsController.replyToPost);
router.get("/mute/:postId", authenticateRequest, mutesController.mutePost);
router.get("/unmute/:postId", authenticateRequest, mutesController.unmutePost);
router.get("/delete/:postId", authenticateRequest, postsController.deletePost);

module.exports = router;