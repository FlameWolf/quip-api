"use strict";

const express = require("express");
const router = express.Router();
const authenticateRequest = require("../middleware/authenticate-request");
const searchController = require("../controllers/search.controller");

router.get("/", authenticateRequest, searchController.searchPosts);

module.exports = router;