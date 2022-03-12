"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { invalidHandles, handleRegExp, passwordRegExp, rounds, timeout, authCookieName } = require("../library");
const generalController = require("./general.controller");
const User = require("../models/user.model");

const createJwt = (handle, userId) => {
	return jwt.sign({ handle, userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
const getExpiryDate = () => {
	var expiresAt = new Date();
	expiresAt.setTime(expiresAt.getTime() + timeout);
	return expiresAt.valueOf();
};
const validateUsername = username => {
	return username && invalidHandles.indexOf(username.trim().toLowerCase()) === -1 && handleRegExp.test(username);
};
const validatePassword = password => {
	return password && passwordRegExp.test(password);
};
const authSuccess = (res, status, action, handle, userId) => {
	res.cookie(authCookieName, userId, { maxAge: getExpiryDate(), httpOnly: false });
	generalController.successResponse(res, status, action, {
		message: `${action} success`,
		userId,
		token: createJwt(handle, userId),
		createdAt: Date.now(),
		expiresIn: timeout
	});
};
const signUp = async (req, res, next) => {
	const signUpAction = "Sign up";
	const { handle, password } = req.body;
	if (!(validateUsername(handle) && validatePassword(password))) {
		generalController.failureResponse(res, 400, signUpAction, "Invalid username/password");
		return;
	}
	if (await User.findOne({ handle })) {
		generalController.failureResponse(res, 400, signUpAction, "Username unavailable");
		return;
	}
	try {
		const passwordHash = await bcrypt.hash(password, rounds);
		const model = new User({ handle, password: passwordHash });
		const user = await model.save();
		authSuccess(res, 201, signUpAction, handle, user._id);
	} catch (err) {
		generalController.failureResponse(res, 500, signUpAction, err.message);
	}
};
const signIn = async (req, res, next) => {
	const signInAction = "Sign in";
	const { handle, password } = req.body;
	const user = await User.findOne({ handle }).select("+password");
	if (!user) {
		generalController.failureResponse(res, 404, signInAction, "User not found");
		return;
	}
	try {
		const authStatus = await bcrypt.compare(password, user.password);
		if (!authStatus) {
			generalController.failureResponse(res, 403, signInAction, "Invalid credentials");
			return;
		}
		authSuccess(res, 200, signInAction, handle, user._id);
	} catch (err) {
		generalController.failureResponse(res, 500, signInAction, err.message);
	}
};
const signOut = async (req, res, next) => {
	const signOutAction = "Sign out";
	res.clearCookie(authCookieName);
	generalController.successResponse(res, 200, signOutAction);
};

module.exports = { signUp, signIn, signOut };