"use strict";

import { ObjectId } from "mongodb";
import { setProperty, getProperty } from "../library";
import Settings from "../models/settings.model";
import { RequestHandler } from "express";

export const getSettingsByUserId = async (userId: string | ObjectId) => {
	const param = { user: userId };
	const settings = await Settings.findOne(param);
	if (!settings) {
		return await new Settings(param).save();
	}
	return settings;
};
export const updateSettingsByUserId = async (userId: string | ObjectId, settings: Dictionary) =>
	await Settings.findOneAndUpdate(
		{
			user: userId
		},
		settings,
		{
			new: true,
			upsert: true
		}
	);
export const getSettings: RequestHandler = async (req, res, next) => {
	const userId = (req.userInfo as UserInfo).userId;
	res.status(200).json({ settings: await getSettingsByUserId(userId) });
};
export const getSettingByPath: RequestHandler = async (req, res, next) => {
	const path = req.params.path;
	const userId = (req.userInfo as UserInfo).userId;
	const settings = await getSettingsByUserId(userId);
	const value = getProperty(settings, path);
	res.status(200).json({ [path]: value });
};
export const updateSettings: RequestHandler = async (req, res, next) => {
	const settings = req.body;
	const userId = (req.userInfo as UserInfo).userId;
	const updated = await updateSettingsByUserId(userId, settings);
	res.status(200).json({ updated });
};
export const updateSettingByPath: RequestHandler = async (req, res, next) => {
	const path = req.params.path;
	const value = req.query.value;
	const userId = (req.userInfo as UserInfo).userId;
	const settings = {};
	setProperty(settings, path, value);
	const updated = await updateSettingsByUserId(userId, settings);
	res.status(200).json({ updated });
};