const successResponse = (res, status, action, payload) => {
	res.status(status).json({
		message: `${action} success`,
		...payload
	});
};
const failureResponse = (res, status, action, error) => {
	res.status(status).json({
		message: `${action} failed`,
		error
	});
};

module.exports = {
	successResponse,
	failureResponse
};