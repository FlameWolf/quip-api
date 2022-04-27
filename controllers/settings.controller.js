"use strict";

const Settings = require("../models/settings.model");

const getSettingsByUserId = async userId => {
	const model = { user: userId };
	return (await Settings.findOne(model)) || (await new Settings(model).save());
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
		res.status(200).json({ settings: getSettingsByUserId(userId) });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getSettingByPath = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const path = req.params.path;
	try {
		const settings = getSettingsByUserId(userId);
		const value = Object.getProperty(settings, path);
		res.status(200).json({ path: value });
	} catch (err) {
		res.status(500).send(err);
	}
};
const updateSettings = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const settings = req.body;
	try {
		const updated = await updateSettingsByUserId(userId, settings);
		res.status(200).json({ updated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const updateSettingByPath = async (req, res, next) => {
	const userId = req.userInfo.userId;
	const path = req.params.path;
	const value = req.query.value;
	try {
		const settings = getSettingsByUserId(userId);
		Object.setProperty(settings, path, value);
		const updated = await updateSettingsByUserId(userId, settings);
		res.status(200).json({ updated });
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports = {
	getSettings,
	getSettingByPath,
	updateSettings,
	updateSettingByPath
};