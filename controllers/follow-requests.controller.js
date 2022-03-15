"use strict";

const pageSize = 65536;
const generalController = require("./general.controller");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");

const acceptHandler = async (followRequestId, acceptorUserId = undefined) => {
	const followRequest = await FollowRequest.findById(followRequestId);
	if (acceptorUserId && acceptorUserId !== followRequest.user) {
		throw new Error("You are not allowed to perform this action");
	}
	await FollowRequest.deleteOne(followRequest);
	return await new Follow({
		user: followRequest.user,
		followedBy: followRequest.requestedBy
	}).save();
};
const rejectHandler = async (followRequestId, rejectorUserId = undefined) => {
	const followRequest = await FollowRequest.findById(followRequestId);
	if (rejectorUserId && rejectorUserId !== followRequest.user) {
		throw new Error("You are not allowed to perform this action");
	}
	await FollowRequest.deleteOne(followRequest);
	return followRequest;
};
const acceptFollowRequest = async (req, res, next) => {
	const acceptFollowRequestAction = "Accept follow request";
	const followRequestId = req.params.requestId;
	const acceptorUserId = req.userInfo.userId;
	try {
		const accepted = await acceptHandler(followRequestId, acceptorUserId);
		generalController.successResponse(res, 200, acceptFollowRequestAction, { accepted });
	} catch (err) {
		generalController.failureResponse(res, 500, acceptFollowRequestAction, err.message);
	}
};
const acceptSelectedFollowRequests = async (req, res, next) => {
	const acceptSelectedFollowRequestsAction = "Accept selected follow requests";
	const followRequestIds = req.body.requestIds;
	const acceptorUserId = req.userInfo.userId;
	try {
		for (let id of followRequestIds) {
			await acceptHandler(id, acceptorUserId);
		}
		generalController.successResponse(res, 200, acceptSelectedFollowRequestsAction, { acceptedRequestIds: followRequestIds });
	} catch (err) {
		generalController.failureResponse(res, 500, acceptSelectedFollowRequestsAction, err.message);
	}
};
const acceptAllFollowRequests = async (req, res, next) => {
	const acceptAllFollowRequestsAction = "Accept all follow requests";
	const acceptorUserId = req.userInfo.userId;
	let acceptedRequestsCount = 0;
	let requestsCount = 0;
	try {
		do {
			const followRequests = await FollowRequest.find({ user: acceptorUserId }).select({ _id: 1 }).limit(pageSize);
			for (let followRequest of followRequests) {
				await acceptHandler(followRequest._id);
			}
			requestsCount = followRequests.length;
			acceptedRequestsCount += requestsCount;
		} while (requestsCount === pageSize);
		generalController.successResponse(res, 200, acceptAllFollowRequestsAction, { acceptedRequestsCount });
	} catch (err) {
		generalController.failureResponse(res, 500, acceptAllFollowRequestsAction, err.message);
	}
};
const rejectFollowRequest = async (req, res, next) => {
	const rejectFollowRequestAction = "Reject follow request";
	const followRequestId = req.params.requestId;
	const rejectorUserId = req.userInfo.userId;
	try {
		const rejected = await rejectHandler(followRequestId, rejectorUserId);
		generalController.successResponse(res, 200, rejectFollowRequestAction, { rejected });
	} catch (err) {
		generalController.failureResponse(res, 500, rejectFollowRequestAction, err.message);
	}
};
const rejectSelectedFollowRequests = async (req, res, next) => {
	const rejectSelectedFollowRequestsAction = "Reject selected follow requests";
	const followRequestIds = req.body.requestIds;
	const rejectorUserId = req.userInfo.userId;
	try {
		for (let id of followRequestIds) {
			await rejectHandler(id, rejectorUserId);
		}
		generalController.successResponse(res, 200, rejectSelectedFollowRequestsAction, { rejectedRequestIds: followRequestIds });
	} catch (err) {
		generalController.failureResponse(res, 500, rejectSelectedFollowRequestsAction, err.message);
	}
};
const rejectAllFollowRequests = async (req, res, next) => {
	const rejectAllFollowRequestsAction = "Reject all follow requests";
	const rejectorUserId = req.userInfo.userId;
	let rejectedRequestsCount = 0;
	let requestsCount = 0;
	try {
		do {
			const followRequests = await FollowRequest.find({ user: rejectorUserId }).select({ _id: 1 }).limit(pageSize);
			for (let followRequest of followRequests) {
				await rejectHandler(followRequest._id);
			}
			requestsCount = followRequests.length;
			rejectedRequestsCount += requestsCount;
		} while (requestsCount === pageSize);
		generalController.successResponse(res, 200, rejectAllFollowRequestsAction, { rejectedRequestsCount });
	} catch (err) {
		generalController.failureResponse(res, 500, rejectAllFollowRequestsAction, err.message);
	}
};

module.exports = {
	acceptFollowRequest,
	acceptSelectedFollowRequests,
	acceptAllFollowRequests,
	rejectFollowRequest,
	rejectSelectedFollowRequests,
	rejectAllFollowRequests
};