"use strict";

import * as express from "express";
import * as searchController from "../controllers/search.controller";

const router = express.Router();
router.get("/", searchController.searchPosts);
router.get("/nearby", searchController.nearbyPosts);
router.get("/users", searchController.searchUsers);

module.exports = router;