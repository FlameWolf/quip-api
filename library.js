"use strict";

const invalidHandles = ["auth", "home", "search", "user", "users", "post", "posts", "quip", "quips", "favourite", "favourites", "unfavourite", "repeat", "repeats", "unrepeat", "reply", "replies", "profile", "profiles", "setting", "settings", "follow", "followed", "follows", "following", "follower", "followers", "unfollow", "mute", "muted", "unmute", "block", "blocked", "unblock", "filter", "filters", "list", "lists", "bookmark", "bookmarks", "unbookmark", "hashtag", "hashtags", "notification", "notifications", "message", "messages", "account", "accounts", "security", "privacy", "admin"];
const handleRegExp = /^[A-Za-z][\w]{3,31}$/;
const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
const rounds = 10;
const timeout = 1000 * 3600 * 24 * 7;
const authCookieName = "userId";
const contentLengthRegExp = /\p{L}\p{M}?|\S|\s/gu;
const maxContentLength = 256;
const mimeTypeMap = [
	{
		mimeType: "image/",
		path: "images"
	},
	{
		mimeType: "video/",
		path: "videos"
	}
];
const mapMimeType = mimeType => mimeTypeMap.find(value => mimeType.startsWith(value.mimeType));
const validateCoordinates = (coordinates, errorConstructor) => {
	if (!Array.isArray(coordinates)) {
		throw new errorConstructor("Point " + coordinates + " must be an array");
	}
	if (coordinates.length !== 2) {
		throw new errorConstructor("Point" + coordinates + " must contain two coordinates");
	}
	if (isNaN(coordinates[0]) || isNaN(coordinates[1])) {
		throw new errorConstructor("Point must have real numbers");
	}
	if (typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") {
		throw new errorConstructor("Point must have two numbers");
	}
	if (coordinates[0] > 180 || coordinates[0] < -180) {
		throw new errorConstructor("Point" + coordinates[0] + " should be within the boundaries of longitude");
	}
	if (coordinates[1] > 90 || coordinates[1] < -90) {
		throw new errorConstructor("Point" + coordinates[1] + " should be within the boundaries of latitude");
	}
};

module.exports = {
	invalidHandles,
	handleRegExp,
	passwordRegExp,
	rounds,
	timeout,
	authCookieName,
	contentLengthRegExp,
	maxContentLength,
	mimeTypeMap,
	mapMimeType,
	validateCoordinates
};