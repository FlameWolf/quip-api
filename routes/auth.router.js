"use strict";

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/sign-up", authController.signUp);
router.post("/sign-in", authController.signIn);
router.post("/refresh-token", authController.refreshAuthToken);
router.get("/revoke-token/:token", authController.revokeRefreshToken);

module.exports = router;