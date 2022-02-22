"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const postsController = require("../controllers/posts.controller");
const favouritesController = require("../controllers/favourites.controller");

router.post("/create", authenticateRequest, postsController.createPost);
router.get("/:postId", postsController.getPost);
router.get("/favourite/:postId", authenticateRequest, favouritesController.addFavourite);
router.get("/unfavourite/:postId", authenticateRequest, favouritesController.removeFavourite);
router.get("/repeat/:postId", authenticateRequest, postsController.repeatPost);
router.get("/unrepeat/:postId", authenticateRequest, postsController.unrepeatPost);
router.post("/reply/:postId", authenticateRequest, postsController.replyToPost);
router.get("/delete/:postId", authenticateRequest, postsController.deletePost);

module.exports = router;