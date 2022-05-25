"use strict";

const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");

router.get("/", searchController.searchPosts);
router.get("/nearby", searchController.nearbyPosts);

module.exports = router;