"use strict";

const invalidHandles = ["auth", "home", "search", "user", "users", "post", "posts", "quip", "quips", "favourite", "favourites", "unfavourite", "repeat", "repeats", "unrepeat", "reply", "replies", "profile", "profiles", "setting", "settings", "follow", "followed", "follows", "following", "follower", "followers", "unfollow", "mute", "muted", "unmute", "block", "blocked", "unblock", "filter", "filters", "list", "lists", "bookmark", "bookmarks", "unbookmark", "hashtag", "hashtags", "notification", "notifications", "message", "messages", "account", "accounts", "security", "privacy", "admin"];
const handleRegExp = /^[A-Za-z][\w]{3,31}$/;
const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
const urlRegExp = /^(\w+[~@#$\-_+]?\w+:\/\/)((\w)+[\-\._~:\/\?#\[\]@!$&'\(\)\*+,;=%]?)+$/;
const emailRegExp = /^[\w\.-]+@[\w\.-]+\.\w+$/;
const rounds = 10;
const authTokenLife = 1000 * 60 * 5;
const contentLengthRegExp = /\p{L}\p{M}?|\S|\s/gu;
const maxContentLength = 256;
const maxMutedWordLength = 256;
const megaByte = 1024 * 1024;

const setProperty = (operand, path, value) => {
	const segments = Array.isArray(path) ? path : path.split(".");
	operand = operand || {};
	if (segments.length > 1) {
		const segment = segments.shift();
		operand[segment] = operand[segment] || {};
		setProperty(operand[segment], segments, value);
	} else {
		operand[segments.pop()] = value;
	}
};
const getProperty = (operand, path) => {
	const segments = Array.isArray(path) ? path : path.split(".");
	if (operand && segments.length) {
		return getProperty(operand[segments.shift()], segments);
	}
	return operand;
};

module.exports = {
	invalidHandles,
	handleRegExp,
	passwordRegExp,
	urlRegExp,
	emailRegExp,
	rounds,
	authTokenLife,
	contentLengthRegExp,
	maxContentLength,
	maxMutedWordLength,
	megaByte,
	setProperty,
	getProperty
};