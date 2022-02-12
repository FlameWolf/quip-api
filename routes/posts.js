"use strict";

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { invalidHandles, handleRegExp, passwordRegExp, rounds, timeout, JWT_SECRET, authCookieName } = require("../library");
const generalController = require("../controllers/general.controller");
const Post = require("../models/post.model");

router.post("/create", async (req, res, next) => {
	const createPostAction = "Create post";
	const content = req.body.content;
	const author = req.body.userId;
	const repeatPost = req.body.repeatPost;
	const replyTo = req.body.replyTo;
	if (!(content || repeatPost)) {
		generalController.failureResponse(res, 400, createPostAction, "No content");
		return;
	}
	const model = new Post({ content, author, repeatPost, replyTo });
	try {
		const post = await model.save();
		generalController.successResponse(res, 201, createPostAction, { post });
	} catch (err) {
		generalController.failureResponse(res, 400, createPostAction, err.message);
	}
});
router.post("/favourite", async (req, res, next) => {
	const favouriteAction = "Add favourite";
});
router.post("/unfavourite", async (req, res, next) => {
	const unfavouriteAction = "Remove favourite";
});
router.post("/repeat", async (req, res, next) => {
	const repeatAction = "Repeat";
});
router.post("/unrepeat", async (req, res, next) => {
	const unrepeatAction = "Undo repeat";
});
router.post("/delete", async (req, res, next) => {
	const deleteAction = "Delete post";
});

module.exports = router;