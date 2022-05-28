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
const maxPollOptionLength = 32;
const maxMutedWordLength = 256;
const minPollDuration = 1000 * 60 * 30;
const maxPollDuration = 1000 * 60 * 60 * 24 * 7;
const favouriteScore = 1;
const quoteScore = 2;
const replyScore = 2;
const voteScore = 2;
const repeatScore = 4;
const nullId = "000000000000000000000000";
const megaByte = 1024 * 1024;
const noReplyEmail = "no-reply@quip-web-app.web.app";
const emailTemplates = {
	actions: {
		rejectEmail: (handle, email, url) => `Hi @<strong>${handle}</strong>, your email address on Quip was changed to <strong>${email}</strong> recently. Click <a target="_blank" href="${url}">here</a> to reject this change if it was not initiated by you.<br/><br/><em>Link valid for only 7 days.</em>`,
		verifyEmail: (handle, email, url) => `Hi @<strong>${handle}</strong>, your email address on Quip was changed to <strong>${email}</strong> recently. Click <a target="_blank" href="${url}">here</a> to verify that this is your email address.<br/><br/><em>Link valid for only 7 days.</em>`,
		resetPassword: (handle, url) => `Hi @<strong>${handle}</strong>, a password reset request was raised for your Quip account. Click <a target="_blank" href="${url}">here</a> to reset your password.<br/><br/><em>This link will be valid for only 7 days.</em>`
	},
	notifications: {
		emailRejected: (handle, email) => `Hi @<strong>${handle}</strong>, your email address change to <strong>${email}</strong> on Quip was rejected.`,
		emailVerified: (handle, email) => `Hi @<strong>${handle}</strong>, your email address <strong>${email}</strong> on Quip has been verified.`,
		passwordChanged: handle => `Hi @<strong>${handle}</strong>, your sign in password on Quip was changed.`,
		passwordReset: handle => `Hi @<strong>${handle}</strong>, your sign in password on Quip was reset.`,
		deactivated: handle => `Hi @<strong>${handle}</strong>, your Quip account was deactivated.`,
		activated: handle => `Hi @<strong>${handle}</strong>, your Quip account was activated.`,
		deleted: handle => `Hi @<strong>${handle}</strong>, your Quip account was deleted. Goodbye!`
	}
};

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
const escapeRegExp = value => value.replace(/[\/.*+?|[()\]{}\$^-]/g, match => `\\${match}`);

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
	maxPollOptionLength,
	maxMutedWordLength,
	minPollDuration,
	maxPollDuration,
	favouriteScore,
	quoteScore,
	replyScore,
	voteScore,
	repeatScore,
	nullId,
	megaByte,
	noReplyEmail,
	emailTemplates,
	setProperty,
	getProperty,
	escapeRegExp
};