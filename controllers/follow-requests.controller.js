"use strict";

const pageSize = 65536;
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
	const followRequestId = req.params.requestId;
	const acceptorUserId = req.userInfo.userId;
	try {
		const accepted = await acceptHandler(followRequestId, acceptorUserId);
		res.status(200).json({ accepted });
	} catch (error) {
		res.status(500).send(error);
	}
};
const acceptSelectedFollowRequests = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const acceptorUserId = req.userInfo.userId;
	try {
		for (let id of followRequestIds) {
			await acceptHandler(id, acceptorUserId);
		}
		res.status(200).json({ acceptedRequestIds: followRequestIds });
	} catch (error) {
		res.status(500).send(error);
	}
};
const acceptAllFollowRequests = async (req, res, next) => {
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
		res.status(200).json({ acceptedRequestsCount });
	} catch (error) {
		res.status(500).send(error);
	}
};
const rejectFollowRequest = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const rejectorUserId = req.userInfo.userId;
	try {
		const rejected = await rejectHandler(followRequestId, rejectorUserId);
		res.status(200).json({ rejected });
	} catch (error) {
		res.status(500).send(error);
	}
};
const rejectSelectedFollowRequests = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const rejectorUserId = req.userInfo.userId;
	try {
		for (let id of followRequestIds) {
			await rejectHandler(id, rejectorUserId);
		}
		res.status(200).json({ rejectedRequestIds: followRequestIds });
	} catch (error) {
		res.status(500).send(error);
	}
};
const rejectAllFollowRequests = async (req, res, next) => {
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
		res.status(200).json({ rejectedRequestsCount });
	} catch (error) {
		res.status(500).send(error);
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