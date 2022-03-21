"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { invalidHandles, handleRegExp, passwordRegExp, rounds, authTokenLife, refreshTokenLife } = require("../library");
const User = require("../models/user.model");

const generateAuthToken = (handle, userId) => {
	return jwt.sign({ handle, userId }, process.env.JWT_AUTH_SECRET, { expiresIn: authTokenLife });
};
const generateRefreshToken = (handle, userId) => {
	return jwt.sign({ handle, userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: refreshTokenLife });
};
const validateUsername = username => {
	return username && invalidHandles.indexOf(username.trim().toLowerCase()) === -1 && handleRegExp.test(username);
};
const validatePassword = password => {
	return password && passwordRegExp.test(password);
};
const authSuccess = (handle, userId) => ({
	userId,
	authToken: generateAuthToken(handle, userId),
	refreshToken: generateRefreshToken(handle, userId),
	createdAt: Date.now(),
	expiresIn: authTokenLife
});
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
		res.status(201).json(authSuccess(handle, user._id));
	} catch (err) {
		res.status(500).send(err);
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
		res.status(200).json(authSuccess(handle, user._id));
	} catch (err) {
		res.status(500).send(err);
	}
};
const refreshAuthToken = async (req, res, next) => {
	try {
		const { "refresh-token": refreshToken, handle, "user-id": userId } = req.headers;
		const userInfo = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
		if (userInfo.handle === handle && userInfo.userId === userId) {
			res.status(200).json(authSuccess(handle, userId));
		} else {
			throw new Error("Refresh token invalid");
		}
	} catch (err) {
		res.status(401).send(err);
		return;
	}
	next();
};
const signOut = async (req, res, next) => {
	res.sendStatus(200);
};

module.exports = { signUp, signIn, refreshAuthToken, signOut };
