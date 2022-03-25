"use strict";

const pageSize = 65536;
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");

const acceptHandler = async (followRequest, acceptorUserId = undefined) => {
	if (acceptorUserId && acceptorUserId !== followRequest.user) {
		throw new Error("You are not allowed to perform this action");
	}
	await FollowRequest.deleteOne(followRequest);
	return await new Follow({
		user: followRequest.user,
		followedBy: followRequest.requestedBy
	}).save();
};
const rejectHandler = async (followRequest, rejectorUserId = undefined) => {
	if (rejectorUserId && rejectorUserId !== followRequest.user) {
		throw new Error("You are not allowed to perform this action");
	}
	await FollowRequest.deleteOne(followRequest);
};
const acceptFollowRequest = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const acceptorUserId = req.userInfo.userId;
	try {
		const followRequest = await FollowRequest.findById(followRequestId);
		if (!followRequest) {
			res.status(404).send(new Error("Follow request not found"));
		}
		const accepted = await acceptHandler(followRequest, acceptorUserId);
		res.status(200).json({ accepted });
	} catch (err) {
		res.status(500).send(err);
	}
};
const acceptSelectedFollowRequests = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const acceptorUserId = req.userInfo.userId;
	try {
		for (const followRequestId of followRequestIds) {
			const followRequest = await FollowRequest.findById(followRequestId);
			if (!followRequest) {
				res.status(404).send(new Error("Follow request not found"));
			}
			await acceptHandler(followRequest, acceptorUserId);
		}
		res.status(200).json({ acceptedRequestIds: followRequestIds });
	} catch (err) {
		res.status(500).send(err);
	}
};
const acceptAllFollowRequests = async (req, res, next) => {
	const acceptorUserId = req.userInfo.userId;
	let acceptedRequestsCount = 0;
	let requestsCount = 0;
	try {
		do {
			const followRequests = await FollowRequest.find({ user: acceptorUserId }).select({ _id: 1 }).limit(pageSize);
			for (const followRequest of followRequests) {
				await acceptHandler(followRequest);
			}
			requestsCount = followRequests.length;
			acceptedRequestsCount += requestsCount;
		} while (requestsCount === pageSize);
		res.status(200).json({ acceptedRequestsCount });
	} catch (err) {
		res.status(500).send(err);
	}
};
const rejectFollowRequest = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const rejectorUserId = req.userInfo.userId;
	try {
		const followRequest = await FollowRequest.findById(followRequestId);
		if (!followRequest) {
			res.status(404).send(new Error("Follow request not found"));
		}
		await rejectHandler(followRequest, rejectorUserId);
		res.status(200).json({ rejected: followRequest });
	} catch (err) {
		res.status(500).send(err);
	}
};
const rejectSelectedFollowRequests = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const rejectorUserId = req.userInfo.userId;
	try {
		for (const followRequestId of followRequestIds) {
			const followRequest = await FollowRequest.findById(followRequestId);
			if (!followRequest) {
				res.status(404).send(new Error("Follow request not found"));
			}
			await rejectHandler(followRequest, rejectorUserId);
		}
		res.status(200).json({ rejectedRequestIds: followRequestIds });
	} catch (err) {
		res.status(500).send(err);
	}
};
const rejectAllFollowRequests = async (req, res, next) => {
	const rejectorUserId = req.userInfo.userId;
	let rejectedRequestsCount = 0;
	let requestsCount = 0;
	try {
		do {
			const followRequests = await FollowRequest.find({ user: rejectorUserId }).select({ _id: 1 }).limit(pageSize);
			for (const followRequest of followRequests) {
				await rejectHandler(followRequest);
			}
			requestsCount = followRequests.length;
			rejectedRequestsCount += requestsCount;
		} while (requestsCount === pageSize);
		res.status(200).json({ rejectedRequestsCount });
	} catch (err) {
		res.status(500).send(err);
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