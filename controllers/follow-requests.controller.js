"use strict";

const generalController = require("./general.controller");
const usersController = require("./users.controller");
const Block = require("../models/block.model");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");

const accept = async (req, res, next) => {};
const acceptAll = async (req, res, next) => {};
const reject = async (req, res, next) => {};
const rejectAll = async (req, res, next) => {};

module.exports = {
	accept,
	acceptAll,
	reject,
	rejectAll
};