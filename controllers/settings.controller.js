"use strict";

const { setProperty, getProperty } = require("../library");
const Settings = require("../models/settings.model");

const getSettingsByUserId = async userId => {
	const param = { user: userId };
	const settings = await Settings.findOne(param);
	if (!settings) {
		return await new Settings(param).save();
	}
	return settings;
};
const updateSettingsByUserId = async (userId, settings) =>
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
const getSettings = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		res.status(200).json({ settings: await getSettingsByUserId(userId) });
	} catch (err) {
		next(err);
	}
};
const getSettingByPath = async (req, res, next) => {
	const path = req.params.path;
	const userId = req.userInfo.userId;
	try {
		const settings = await getSettingsByUserId(userId);
		const value = getProperty(settings, path);
		res.status(200).json({ [path]: value });
	} catch (err) {
		next(err);
	}
};
const updateSettings = async (req, res, next) => {
	const settings = req.body;
	const userId = req.userInfo.userId;
	try {
		const updated = await updateSettingsByUserId(userId, settings);
		res.status(200).json({ updated });
	} catch (err) {
		next(err);
	}
};
const updateSettingByPath = async (req, res, next) => {
	const path = req.params.path;
	const value = req.query.value;
	const userId = req.userInfo.userId;
	try {
		const settings = {};
		setProperty(settings, path, value);
		const updated = await updateSettingsByUserId(userId, settings);
		res.status(200).json({ updated });
	} catch (err) {
		next(err);
	}
};

module.exports = {
	getSettings,
	getSettingByPath,
	updateSettings,
	updateSettingByPath
};