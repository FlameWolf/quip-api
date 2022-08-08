"use strict";

import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { invalidHandles, handleRegExp, passwordRegExp, rounds, authTokenLife, AuthPayload } from "../library";
import User from "../models/user.model";
import RefreshToken from "../models/refresh-token.model";
import { RequestHandler } from "express";

const generateAuthToken = (handle: string, userId: string) => {
	return jwt.sign({ handle, userId }, process.env.JWT_AUTH_SECRET as string, { expiresIn: authTokenLife });
};
const generateRefreshToken = (handle: string, userId: string) => {
	return jwt.sign({ handle, userId }, process.env.JWT_REFRESH_SECRET as string);
};
const validateHandle = (handle: string) => {
	return handle && invalidHandles.indexOf(handle.trim().toLowerCase()) === -1 && handleRegExp.test(handle);
};
const validatePassword = (password: string) => {
	return password && passwordRegExp.test(password);
};
const authSuccess = async (handle: string, userId: string, includeRefreshToken = true) => {
	const payload: AuthPayload = {
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
export const signUp: RequestHandler = async (req, res, next) => {
	const { handle, password } = req.body;
	if (!(validateHandle(handle) && validatePassword(password))) {
		res.status(400).send("Invalid username/password");
		return;
	}
	if (await User.countDocuments({ handle })) {
		res.status(409).send("Username unavailable");
		return;
	}
	const passwordHash = bcrypt.hashSync(password, rounds);
	const user = await new User({ handle, password: passwordHash }).save();
	const userId = user._id;
	res.status(201).json(await authSuccess(handle, userId.toString()));
};
export const signIn: RequestHandler = async (req, res, next) => {
	const { handle, password } = req.body;
	const user = await User.findOne({ handle }).select("+password");
	if (!user) {
		res.status(404).send("User not found");
		return;
	}
	const authStatus = bcrypt.compareSync(password, user.password);
	if (!authStatus) {
		res.status(403).send("Invalid credentials");
		return;
	}
	const userId = user._id;
	res.status(200).json(await authSuccess(handle, userId.toString()));
};
export const refreshAuthToken: RequestHandler = async (req, res, next) => {
	const { refreshToken } = req.body;
	const { "x-slug": handle, "x-uid": userId } = req.headers as Dictionary<string>;
	if (!refreshToken) {
		res.status(400).send("Refresh token not provided");
		return;
	}
	const userInfo = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as UserInfo;
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
};
export const revokeRefreshToken: RequestHandler = async (req, res, next) => {
	const refreshToken = req.params.token;
	if (!refreshToken) {
		res.status(400).send("Refresh token not provided");
		return;
	}
	const deleted = await RefreshToken.findOneAndDelete({ token: refreshToken });
	res.status(deleted ? 200 : 404).send(undefined);
};