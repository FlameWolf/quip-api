"use strict";

const express = require("express");
const router = express.Router();
const requireAuthentication = require("../middleware/require-authentication");
const searchController = require("../controllers/search.controller");

router.get("/", requireAuthentication, searchController.searchPosts);

module.exports = router;