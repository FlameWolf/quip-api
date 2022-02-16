"use strict";

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