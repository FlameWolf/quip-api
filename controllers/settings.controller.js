"use strict";

const generalController = require("./general.controller");
const User = require("../models/user.model");

const deactivateUser = async (req, res, next) => {
	const deactivateUserAction = "Deactivate user";
	const userHandle = req.userInfo.handle;
	try {
		const result = await User.findOneAndUpdate(
			{
				handle: userHandle,
				isDeactivated: false,
				isDeleted: false
			},
			{
				isDeactivated: true
			}
		);
		generalController.successResponse(res, 200, deactivateUserAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, deactivateUserAction, err.message);
	}
};
const activateUser = async (req, res, next) => {
	const activateUserAction = "Activate user";
	const userHandle = req.userInfo.handle;
	try {
		const result = await User.findOneAndUpdate(
			{
				handle: userHandle,
				isDeactivated: true,
				isDeleted: false
			},
			{
				isDeactivated: false
			}
		);
		generalController.successResponse(res, 200, activateUserAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, activateUserAction, err.message);
	}
};
const deleteUser = async (req, res, next) => {
	const deleteUserAction = "Delete user";
	const userHandle = req.userInfo.handle;
	try {
		const result = await User.findOneAndUpdate(
			{
				handle: userHandle,
				isDeactivated: false,
				isDeleted: false
			},
			{
				isDeleted: true
			}
		);
		generalController.successResponse(res, 200, deleteUserAction, result);
	} catch (err) {
		generalController.failureResponse(res, 500, deleteUserAction, err.message);
	}
};

module.exports = {
	deactivateUser,
	activateUser,
	deleteUser
};