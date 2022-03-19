"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { invalidHandles, handleRegExp, passwordRegExp, rounds, timeout, authCookieName } = require("../library");
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
const authSuccess = (res, statusCode, handle, userId) => {
	res.cookie(authCookieName, userId, { maxAge: getExpiryDate(), httpOnly: false });
	res.status(statusCode).json({
		userId,
		token: createJwt(handle, userId),
		createdAt: Date.now(),
		expiresIn: timeout
	});
};
const signUp = async (req, res, next) => {
	const { handle, password } = req.body;
	if (!(validateUsername(handle) && validatePassword(password))) {
		res.status(400).send("Invalid username/password");
		return;
	}
	if (await User.findOne({ handle })) {
		res.status(400).send("Username unavailable");
		return;
	}
	try {
		const passwordHash = await bcrypt.hash(password, rounds);
		const user = await new User({ handle, password: passwordHash }).save();
		authSuccess(res, 201, handle, user._id);
	} catch (error) {
		res.status(500).send(error);
	}
};
const signIn = async (req, res, next) => {
	const { handle, password } = req.body;
	const user = await User.findOne({ handle }).select("+password");
	if (!user) {
		res.status(404).send("User not found");
		return;
	}
	try {
		const authStatus = await bcrypt.compare(password, user.password);
		if (!authStatus) {
			res.status(403).send("Invalid credentials");
			return;
		}
		authSuccess(res, 200, handle, user._id);
	} catch (error) {
		res.status(500).send(error);
	}
};
const signOut = async (req, res, next) => {
	res.clearCookie(authCookieName);
	res.sendStatus(200);
};

module.exports = { signUp, signIn, signOut };