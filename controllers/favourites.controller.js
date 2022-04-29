"use strict";

const Favourite = require("../models/favourite.model");

const addFavourite = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const favourited = await new Favourite({
			post: postId,
			favouritedBy: userId
		}).save();
		res.status(200).json({ favourited });
	} catch (err) {
		res.status(500).send(err);
	}
};
const removeFavourite = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unfavourited = await Favourite.findOneAndDelete({
			post: postId,
			favouritedBy: userId
		});
		res.status(200).json({ unfavourited });
	} catch (err) {
		res.status(500).send(err);
	}
};
const isFavourited = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const count = await Favourite.countDocuments({
			post: postId,
			favouritedBy: userId
		});
		res.status(200).send(count);
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports = {
	addFavourite,
	removeFavourite,
	isFavourited
};