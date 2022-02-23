"use strict";

const generalController = require("./general.controller");
const MuteUser = require("../models/mute.user.model");
const MutePost = require("../models/mute.post.model");
const MuteWord = require("../models/mute.word.model");

const muteUser = (req, res, next) => {};
const mutePost = (req, res, next) => {};
const muteWord = (req, res, next) => {};
const unmuteUser = (req, res, next) => {};
const unmutePost = (req, res, next) => {};
const unmuteWord = (req, res, next) => {};

module.exports = {
	muteUser,
	mutePost,
	muteWord,
	unmuteUser,
	unmutePost,
	unmuteWord
};