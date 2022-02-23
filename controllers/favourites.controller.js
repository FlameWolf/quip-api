"use strict";

const generalController = require("./general.controller");
const Favourite = require("../models/favourite.model");

const addFavourite = async (req, res, next) => {
	const favouritePostAction = "Add favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const model = new Favourite({
		post: postId,
		favouritedBy: userId
	});
	try {
		const favourite = await model.save();
		generalController.successResponse(res, 200, favouritePostAction, favourite);
	} catch (err) {
		generalController.failureResponse(res, 500, favouritePostAction, err.message);
	}
};
const removeFavourite = async (req, res, next) => {
	const unfavouritePostAction = "Remove favourite";
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const response = await Favourite.findOneAndDelete({
			post: postId,
			favouritedBy: userId
		});
		generalController.successResponse(res, 200, unfavouritePostAction, response);
	} catch (err) {
		generalController.failureResponse(res, 500, unfavouritePostAction, err.message);
	}
};

module.exports = { addFavourite, removeFavourite };