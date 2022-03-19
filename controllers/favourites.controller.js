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
		res.status(200).json({ favourited });
	} catch (error) {
		res.status(500).json({ error });
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
		res.status(200).json({ unfavourited });
	} catch (error) {
		res.status(500).json({ error });
	}
};

module.exports = { addFavourite, removeFavourite };