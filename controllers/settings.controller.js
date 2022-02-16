"use strict";

const generalController = require("./general.controller");
const User = require("../models/user.model");

const muteWord = async (req, res, next) => {
	const muteWordAction = "Mute word";
	const word = req.body.word;
	const match = req.body.match;
	const userId = req.userInfo.userId;
	try {
		const user = await User.findOne({ _id: userId, "muteList.words": { $elemMatch: { word, match } } });
		if (user) {
			generalController.failureResponse(res, 422, muteWordAction, "Word already muted for the specified match type");
			return;
		}
		await User.updateOne(user, { $addToSet: { "muteList.words": { word, match } } });
		generalController.successResponse(res, 200, muteWordAction, { mutedWord: word, matchType: match, mutedBy: user });
	} catch (err) {
		generalController.failureResponse(res, 500, muteWordAction, err.message);
	}
};
const unmuteWord = async (req, res, next) => {
	const unmuteWordAction = "Unmute word";
	const word = req.body.word;
	const match = req.body.match;
	const userId = req.userInfo.userId;
	try {
		const result = await User.findByIdAndUpdate(userId, { $pull: { "muteList.words": { word, match } } });
		generalController.successResponse(res, 200, unmuteWordAction, { unmutedWord: word, matchType: match, unmutedBy: result });
	} catch (err) {
		generalController.failureResponse(res, 500, unmuteWordAction, err.message);
	}
};
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
	muteWord,
	unmuteWord,
	deactivateUser,
	activateUser,
	deleteUser
};