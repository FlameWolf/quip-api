"use strict";

const generalController = require("./general.controller");
const Favourite = require("../models/favourite.model");

const addFavourite = async (req, res, next) => {
	const favouritePostAction = "Add favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const favourited = await new Favourite({
			post: postId,
			favouritedBy: userId
		}).save();
		generalController.successResponse(res, 200, favouritePostAction, { favourited });
	} catch (err) {
		generalController.failureResponse(res, 500, favouritePostAction, err.message);
	}
};
const removeFavourite = async (req, res, next) => {
	const unfavouritePostAction = "Remove favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unfavourited = await Favourite.findOneAndDelete({
			post: postId,
			favouritedBy: userId
		});
		generalController.successResponse(res, 200, unfavouritePostAction, { unfavourited });
	} catch (err) {
		generalController.failureResponse(res, 500, unfavouritePostAction, err.message);
	}
};

module.exports = { addFavourite, removeFavourite };