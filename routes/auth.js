"use strict";

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { invalidHandles, rounds, timeout, JWT_SECRET, handleRegExp, passwordRegExp } = require("../library");
const jwt = require("jsonwebtoken");
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
const handleAuthSuccess = (res, status, action, handle, id) => {
	res.cookie("userId", id, { maxAge: getExpiryDate(), httpOnly: false })
		.status(status)
		.json({
			message: `${action} success`,
			userId: id,
			token: createJwt(handle, id),
			createdAt: Date.now(),
			expiresIn: timeout
		});
};
const handleAuthFailure = (res, status, action, err) => {
	res.status(status).json({
		message: `${action} failed`,
		error: err.message
	});
};

router.post("/sign-up", async (req, res, next) => {
	const authAction = "Sign up";
	const handle = req.body.handle;
	const password = req.body.password;
	if (!(validateUsername(handle) && validatePassword(password))) {
		handleAuthFailure(res, 400, authAction, new Error("Invalid username/password"));
		return;
	}
	try {
		const passwordHash = await bcrypt.hash(password, rounds);
		const model = new User({
			handle,
			password: passwordHash
		});
		const user = await model.save();
		handleAuthSuccess(res, 201, authAction, handle, user._id);
	} catch (err) {
		handleAuthFailure(res, 500, authAction, err);
	}
});
router.post("/sign-in", async (req, res, next) => {
	const authAction = "Sign in";
	const handle = req.body.handle;
	const password = req.body.password;
	const foundUser = await User.findOne({ handle });
	if (!foundUser) {
		handleAuthFailure(res, 404, authAction, new Error("User not found"));
		return;
	}
	try {
		const authStatus = await bcrypt.compare(password, foundUser.password);
		if (!authStatus) {
			handleAuthFailure(res, 403, authAction, new Error("Invalid credentials"));
			return;
		}
		handleAuthSuccess(res, 200, authAction, handle, foundUser._id);
	} catch (err) {
		handleAuthFailure(res, 500, authAction, err);
	}
});

module.exports = router;