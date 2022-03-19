"use strict";

const User = require("../models/user.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, deactivated: false, deleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, deactivated: false, deleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, deleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, deleted: false });
const getUser = async (req, res, next) => {
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		res.status(200).json({ user });
	} catch (err) {
		res.status(500).send(err);
	}
};
const getUserProfile = async (req, res, next) => {
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		res.status(200).json({ user });
	} catch (err) {
		res.status(500).send(err);
	}
};
const deactivateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const deactivated = await User.findByIdAndUpdate(userId, { deactivated: true });
		res.status(200).json({ deactivated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const activateUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const activated = await User.findByIdAndUpdate(userId, { deactivated: false });
		res.status(200).json({ activated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const deleteUser = async (req, res, next) => {
	const userId = req.userInfo.userId;
	try {
		const deleted = await User.findByIdAndUpdate(userId, { deleted: true });
		res.status(200).json({ deleted });
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports = {
	findActiveUserById,
	findActiveUserByHandle,
	findUserById,
	findUserByHandle,
	getUser,
	getUserProfile,
	deactivateUser,
	activateUser,
	deleteUser
};