"use strict";

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
	successResponse,
	failureResponse
};