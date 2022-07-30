"use strict";

import * as express from "express";
import * as authController from "../controllers/auth.controller";

const router = express.Router();
router.post("/sign-up", authController.signUp);
router.post("/sign-in", authController.signIn);
router.post("/refresh-token", authController.refreshAuthToken);
router.get("/revoke-token/:token", authController.revokeRefreshToken);

module.exports = router;