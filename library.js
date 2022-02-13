"use strict";

const invalidHandles = ["auth", "home", "search", "user", "users", "quip", "quips", "favourite", "favourites", "repost", "reposts", "reply", "replies", "profile", "profiles", "setting", "settings", "follow", "followed", "follows", "following", "follower", "followers", "mute", "muted", "block", "blocked", "filter", "filters", "list", "lists", "bookmark", "bookmarks", "hashtag", "hashtags", "notification", "notifications", "message", "messages", "account", "accounts", "security", "privacy"];
const handleRegExp = /^[A-Za-z][\w]{3,31}$/;
const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
const rounds = 10;
const timeout = 1000 * 3600 * 24 * 7;
const jwtSecret = "22b79d62c4273ab9ff785f55dc16615e";
const authCookieName = "userId";
const contentLengthRegExp = /\p{L}\p{M}?|\S|\s/gu;
const maxContentLength = 256;

module.exports = {
	invalidHandles,
	handleRegExp,
	passwordRegExp,
	rounds,
	timeout,
	jwtSecret,
	authCookieName,
	contentLengthRegExp,
	maxContentLength
};