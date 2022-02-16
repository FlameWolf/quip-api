"use strict";

const generalController = require("./general.controller");
const User = require("../models/user.model");
const Post = require("../models/post.model");

const home = (req, res, next) => {
	res.status(200).end();
};
const timeline = (req, res, next) => {
	res.status(200).end();
};
const timelineTop = (req, res, next) => {
	res.status(200).end();
};

module.exports = { home, timeline, timelineTop };