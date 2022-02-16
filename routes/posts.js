"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const generalController = require("../controllers/general.controller");
const postController = require("../controllers/post.controller");
const Post = require("../models/post.model");
const User = require("../models/user.model");

router.post("/create", authenticateRequest, postController.createPost);
router.get("/:postId", postController.getPost);
router.get("/favourite/:postId", authenticateRequest, postController.favouritePost);
router.get("/unfavourite/:postId", authenticateRequest, postController.unfavouritePost);
router.get("/repeat/:postId", authenticateRequest, postController.repeatPost);
router.get("/unrepeat/:postId", authenticateRequest, postController.unrepeatPost);
router.post("/reply/:postId", authenticateRequest, postController.replyToPost);
router.get("/delete/:postId", authenticateRequest, postController.deletePost);

module.exports = router;