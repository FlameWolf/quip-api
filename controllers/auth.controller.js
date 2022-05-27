"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { invalidHandles, handleRegExp, passwordRegExp, rounds, authTokenLife } = require("../library");
const User = require("../models/user.model");
const RefreshToken = require("../models/refresh-token.model");

const generateAuthToken = (handle, userId) => {
	return jwt.sign({ handle, userId }, process.env.JWT_AUTH_SECRET, { expiresIn: authTokenLife });
};
const generateRefreshToken = (handle, userId) => {
	return jwt.sign({ handle, userId }, process.env.JWT_REFRESH_SECRET);
};
const validateHandle = handle => {
	return handle && invalidHandles.indexOf(handle.trim().toLowerCase()) === -1 && handleRegExp.test(handle);
};
const validatePassword = password => {
	return password && passwordRegExp.test(password);
};
const authSuccess = async (handle, userId, includeRefreshToken = true) => {
	const payload = {
		userId,
		authToken: generateAuthToken(handle, userId),
		createdAt: Date.now(),
		expiresIn: authTokenLife
	};
	if (includeRefreshToken) {
		const refreshToken = generateRefreshToken(handle, userId);
		payload.refreshToken = refreshToken;
		await new RefreshToken({
			user: userId,
			token: refreshToken
		}).save();
	}
	return payload;
};
const signUp = async (req, res, next) => {
	const { handle, password } = req.body;
	if (!(validateHandle(handle) && validatePassword(password))) {
		res.status(400).send("Invalid username/password");
		return;
	}
	if (await User.countDocuments({ handle })) {
		res.status(409).send("Username unavailable");
		return;
	}
	try {
		const passwordHash = await bcrypt.hash(password, rounds);
		const user = await new User({ handle, password: passwordHash }).save();
		const userId = user._id;
		res.status(201).json(await authSuccess(handle, userId));
	} catch (err) {
		next(err);
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
		const userId = user._id;
		res.status(200).json(await authSuccess(handle, userId));
	} catch (err) {
		next(err);
	}
};
const refreshAuthToken = async (req, res, next) => {
	const { refreshToken } = req.body;
	const { "x-slug": handle, "x-uid": userId } = req.headers;
	if (!refreshToken) {
		res.status(400).send("Refresh token not found");
		return;
	}
	try {
		const userInfo = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
		const filter = { user: userId, token: refreshToken };
		if (userInfo.handle !== handle || userInfo.userId !== userId) {
			res.status(401).send("Refresh token invalid");
			return;
		}
		if (!(await RefreshToken.countDocuments(filter))) {
			res.status(401).send("Refresh token revoked or expired");
			return;
		}
		await RefreshToken.findOneAndUpdate(filter, { lastUsed: new Date() });
		res.status(200).json(await authSuccess(handle, userId, false));
	} catch (err) {
		next(err);
	}
};
const revokeRefreshToken = async (req, res, next) => {
	const refreshToken = req.params.token;
	if (!refreshToken) {
		res.status(400).send("Refresh token not found");
		return;
	}
	try {
		await RefreshToken.findOneAndDelete({ token: refreshToken });
		res.sendStatus(200);
	} catch (err) {
		next(err);
	}
};
const signOut = async (req, res, next) => {
	res.sendStatus(200);
};

module.exports = {
	signUp,
	signIn,
	refreshAuthToken,
	revokeRefreshToken,
	signOut
};