"use strict";

const generalController = require("./general.controller");
const User = require("../models/user.model");

const findActiveUserById = async userId => await User.findOne({ _id: userId, isDeactivated: false, isDeleted: false });
const findActiveUserByHandle = async handle => await User.findOne({ handle, isDeactivated: false, isDeleted: false });
const findUserById = async userId => await User.findOne({ _id: userId, isDeleted: false });
const findUserByHandle = async handle => await User.findOne({ handle, isDeleted: false });
const getUser = async (req, res, next) => {
	const getUserProfileAction = "Get user profile";
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			generalController.failureResponse(res, 404, getUserProfileAction, "User not found");
			return;
		}
		generalController.successResponse(res, 200, getUserProfileAction, { user });
	} catch (err) {
		generalController.failureResponse(res, 500, getUserProfileAction, err.message);
	}
};
const getUserProfile = async (req, res, next) => {
	const getUserProfileAction = "Get user profile";
	const handle = req.params.handle;
	try {
		const user = await findActiveUserByHandle(handle);
		if (!user) {
			generalController.failureResponse(res, 404, getUserProfileAction, "User not found");
			return;
		}
		generalController.successResponse(res, 200, getUserProfileAction, { user });
	} catch (err) {
		generalController.failureResponse(res, 500, getUserProfileAction, err.message);
	}
};
const deactivateUser = async (req, res, next) => {
	const deactivateUserAction = "Deactivate user";
	const userId = req.userInfo.userId;
	try {
		const result = await User.findByIdAndUpdate(userId, { isDeactivated: true });
		generalController.successResponse(res, 200, deactivateUserAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, deactivateUserAction, err.message);
	}
};
const activateUser = async (req, res, next) => {
	const activateUserAction = "Activate user";
	const userId = req.userInfo.userId;
	try {
		const result = await User.findByIdAndUpdate(userId, { isDeactivated: false });
		generalController.successResponse(res, 200, activateUserAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, activateUserAction, err.message);
	}
};
const deleteUser = async (req, res, next) => {
	const deleteUserAction = "Delete user";
	const userId = req.userInfo.userId;
	try {
		const result = await User.findByIdAndUpdate(userId, { isDeleted: true });
		generalController.successResponse(res, 200, deleteUserAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, deleteUserAction, err.message);
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