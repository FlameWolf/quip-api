"use strict";

import express from "express";
import * as searchController from "../controllers/search.controller.ts";

const router = express.Router();
router.get("/", searchController.searchPosts);
router.get("/nearby", searchController.nearbyPosts);
router.get("/users", searchController.searchUsers);

export default router;