"use strict";

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/sign-up", authController.signUp);
router.post("/sign-in", authController.signIn);
router.get("/refresh-auth-token", authController.refreshAuthToken);
router.get("/sign-out", authController.signOut);

module.exports = router;