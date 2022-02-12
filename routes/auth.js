"use strict";

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { invalidHandles, handleRegExp, passwordRegExp, rounds, timeout, JWT_SECRET, authCookieName } = require("../library");
const generalController = require("../controllers/general.controller");
const User = require("../models/user.model");

const createJwt = (handle, id) => {
	return jwt.sign({ handle, id }, JWT_SECRET, { expiresIn: "7d" });
};
const getExpiryDate = () => {
	var expiresAt = new Date();
	expiresAt.setTime(expiresAt.getTime() + timeout);
	return expiresAt.valueOf();
};
const validateUsername = username => {
	return invalidHandles.indexOf(username.trim().toLowerCase()) === -1 && handleRegExp.test(username);
};
const validatePassword = password => {
	return passwordRegExp.test(password);
};
const authSuccess = (res, status, action, handle, id) => {
	res.cookie(authCookieName, id, { maxAge: getExpiryDate(), httpOnly: false });
	generalController.successResponse(res, status, action, {
		message: `${action} success`,
		userId: id,
		token: createJwt(handle, id),
		createdAt: Date.now(),
		expiresIn: timeout
	});
};

router.post("/sign-up", async (req, res, next) => {
	const authAction = "Sign up";
	const handle = req.body.handle;
	const password = req.body.password;
	if (!(validateUsername(handle) && validatePassword(password))) {
		generalController.failureResponse(res, 400, authAction, "Invalid username/password");
		return;
	}
	try {
		const passwordHash = await bcrypt.hash(password, rounds);
		const model = new User({ handle, password: passwordHash });
		const user = await model.save();
		authSuccess(res, 201, authAction, handle, user._id);
	} catch (err) {
		generalController.failureResponse(res, 500, authAction, err.message);
	}
});
router.post("/sign-in", async (req, res, next) => {
	const authAction = "Sign in";
	const handle = req.body.handle;
	const password = req.body.password;
	const foundUser = await User.findOne({ handle }).select("+password");
	if (!foundUser) {
		generalController.failureResponse(res, 404, authAction, "User not found");
		return;
	}
	try {
		const authStatus = await bcrypt.compare(password, foundUser.password);
		if (!authStatus) {
			generalController.failureResponse(res, 403, authAction, "Invalid credentials");
			return;
		}
		authSuccess(res, 200, authAction, handle, foundUser._id);
	} catch (err) {
		generalController.failureResponse(res, 500, authAction, err.message);
	}
});
router.get("/sign-out", async (req, res, next) => {
	res.clearCookie(authCookieName);
	generalController.successResponse(res, 200, "Sign out");
});

module.exports = router;