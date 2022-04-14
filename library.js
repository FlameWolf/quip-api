"use strict";

const invalidHandles = ["auth", "home", "search", "user", "users", "post", "posts", "quip", "quips", "favourite", "favourites", "unfavourite", "repeat", "repeats", "unrepeat", "reply", "replies", "profile", "profiles", "setting", "settings", "follow", "followed", "follows", "following", "follower", "followers", "unfollow", "mute", "muted", "unmute", "block", "blocked", "unblock", "filter", "filters", "list", "lists", "bookmark", "bookmarks", "unbookmark", "hashtag", "hashtags", "notification", "notifications", "message", "messages", "account", "accounts", "security", "privacy", "admin"];
const handleRegExp = /^[A-Za-z][\w]{3,31}$/;
const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
const urlRegExp = /^(\w+[~@#$\-_+]?\w+:\/\/)((\w)+[\-\._~:\/\?#\[\]@!$&'\(\)\*+,;=%]?)+$/;
const emailRegExp = /^[\w\.-]+@[\w\.-]+\.\w+$/;
const rounds = 10;
const authTokenLife = 1000 * 60 * 5;
const refreshTokenLife = 1000 * 3600 * 24 * 365.256 * 100;
const refreshTokenCookieName = "refresh-token";
const contentLengthRegExp = /\p{L}\p{M}?|\S|\s/gu;
const maxContentLength = 256;
const maxMutedWordLength = 256;
const megaByte = 1024 * 1024;

module.exports = {
	invalidHandles,
	handleRegExp,
	passwordRegExp,
	urlRegExp,
	emailRegExp,
	rounds,
	authTokenLife,
	refreshTokenLife,
	refreshTokenCookieName,
	contentLengthRegExp,
	maxContentLength,
	maxMutedWordLength,
	megaByte
};