"use strict";

const User = require("../models/user.model");
const Post = require("../models/post.model");

const home = async (req, res, next) => {
	res.status(200).end();
};
const timeline = async (req, res, next) => {
	res.status(200).end();
};
const timelineTop = async (req, res, next) => {
	res.status(200).end();
};

module.exports = { home, timeline, timelineTop };