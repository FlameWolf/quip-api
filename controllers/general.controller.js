"use strict";

const sendResponse = (res, statusCode, action, payload = undefined) => {
	res.status(statusCode).json({
		message: `${action} ${statusCode < 400 ? "success" : "failed"}`,
		...payload
	});
};
const successResponse = (res, status, action, payload) => {
	res.status(status).json({
		message: `${action} success`,
		...payload
	});
};
const failureResponse = (res, status, action, errorMessage) => {
	res.status(status).json({
		message: `${action} failed`,
		error: errorMessage
	});
};

module.exports = {
	sendResponse,
	successResponse,
	failureResponse
};