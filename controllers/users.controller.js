"use strict";

const generalController = require("./general.controller");
const User = require("../models/user.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, deactivated: false, deleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, deactivated: false, deleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, deleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, deleted: false });
const getUser = async (req, res, next) => {
	const getUserProfileAction = "Get user profile";
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			generalController.sendResponse(res, 404, getUserProfileAction, "User not found");
			return;
		}
		generalController.sendResponse(res, 200, getUserProfileAction, { user });
	} catch (err) {
		generalController.sendResponse(res, 500, getUserProfileAction, err);
	}
};
const getUserProfile = async (req, res, next) => {
	const getUserProfileAction = "Get user profile";
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			generalController.sendResponse(res, 404, getUserProfileAction, "User not found");
			return;
		}
		generalController.sendResponse(res, 200, getUserProfileAction, { user });
	} catch (err) {
		generalController.sendResponse(res, 500, getUserProfileAction, err);
	}
};
const deactivateUser = async (req, res, next) => {
	const deactivateUserAction = "Deactivate user";
	const userId = req.userInfo.userId;
	try {
		const result = await User.findByIdAndUpdate(userId, { deactivated: true });
		generalController.sendResponse(res, 200, deactivateUserAction, result);
	} catch (err) {
		generalController.sendResponse(res, 500, deactivateUserAction, err);
	}
};
const activateUser = async (req, res, next) => {
	const activateUserAction = "Activate user";
	const userId = req.userInfo.userId;
	try {
		const result = await User.findByIdAndUpdate(userId, { deactivated: false });
		generalController.sendResponse(res, 200, activateUserAction, result);
	} catch (err) {
		generalController.sendResponse(res, 500, activateUserAction, err);
	}
};
const deleteUser = async (req, res, next) => {
	const deleteUserAction = "Delete user";
	const userId = req.userInfo.userId;
	try {
		const result = await User.findByIdAndUpdate(userId, { deleted: true });
		generalController.sendResponse(res, 200, deleteUserAction, result);
	} catch (err) {
		generalController.sendResponse(res, 500, deleteUserAction, err);
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