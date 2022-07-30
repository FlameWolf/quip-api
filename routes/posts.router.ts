"use strict";

import * as express from "express";
import * as postsController from "../controllers/posts.controller";
import * as favouritesController from "../controllers/favourites.controller";
import * as bookmarksController from "../controllers/bookmarks.controller";
import * as mutesController from "../controllers/mutes.controller";

const requireAuthentication = require("../middleware/requireAuthentication");
const extractMediaFile = require("../middleware/extractMediaFile");
const router = express.Router();
router.post("/create", requireAuthentication, extractMediaFile, postsController.createPost);
router.post("/update/:postId", requireAuthentication, postsController.updatePost);
router.get("/favourite/:postId", requireAuthentication, favouritesController.addFavourite);
router.get("/unfavourite/:postId", requireAuthentication, favouritesController.removeFavourite);
router.get("/bookmark/:postId", requireAuthentication, bookmarksController.addBookmark);
router.get("/unbookmark/:postId", requireAuthentication, bookmarksController.removeBookmark);
router.post("/quote/:postId", requireAuthentication, extractMediaFile, postsController.quotePost);
router.get("/repeat/:postId", requireAuthentication, postsController.repeatPost);
router.get("/unrepeat/:postId", requireAuthentication, postsController.unrepeatPost);
router.post("/reply/:postId", requireAuthentication, extractMediaFile, postsController.replyToPost);
router.get("/mute/:postId", requireAuthentication, mutesController.mutePost);
router.get("/unmute/:postId", requireAuthentication, mutesController.unmutePost);
router.get("/vote/:postId", requireAuthentication, postsController.castVote);
router.delete("/delete/:postId", requireAuthentication, postsController.deletePost);
router.get("/:postId", postsController.getPost);
router.get("/:postId/quotes", postsController.getPostQuotes);
router.get("/:postId/replies", postsController.getPostReplies);
router.get("/:postId/parent", postsController.getPostParent);

module.exports = router;