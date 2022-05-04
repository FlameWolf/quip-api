"use strict";

const pageSize = 65536;
const mongoose = require("mongoose");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");

const deleteFollowRequest = async (followRequest, session, userId = undefined) => {
	if (userId && userId !== followRequest.user) {
		throw new Error("You are not allowed to perform this action");
	}
	await FollowRequest.deleteOne(followRequest).session(session);
};
const acceptHandler = async (followRequest, session, acceptorUserId = undefined) => {
	await deleteFollowRequest(followRequest, session, acceptorUserId);
	return await new Follow({
		user: followRequest.user,
		followedBy: followRequest.requestedBy
	}).save({ session });
};
const rejectHandler = async (followRequest, session, rejectorUserId = undefined) => {
	await deleteFollowRequest(followRequest, session, rejectorUserId);
};
const acceptFollowRequest = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const acceptorUserId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		const followRequest = await FollowRequest.findById(followRequestId);
		if (!followRequest) {
			res.status(404).send(new Error("Follow request not found"));
		}
		await session.withTransaction(async () => {
			const accepted = await acceptHandler(followRequest, session, acceptorUserId);
			res.status(200).json({ accepted });
		});
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const acceptSelectedFollowRequests = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const acceptorUserId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const followRequests = await Promise.all(followRequestIds.map(id => FollowRequest.findById(id)));
			await Promise.all(followRequests.map(followRequest => acceptHandler(followRequest, session, acceptorUserId)));
		});
		res.status(200).json({ acceptedRequestIds: followRequestIds });
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const acceptAllFollowRequests = async (req, res, next) => {
	const acceptorUserId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		let acceptedRequestsCount = 0;
		let requestsCount = 0;
		await session.withTransaction(async () => {
			do {
				const followRequests = await FollowRequest.find({ user: acceptorUserId }).session(session).select({ _id: 1 }).limit(pageSize);
				await Promise.all(followRequests.map(followRequest => acceptHandler(followRequest, session, acceptorUserId)));
				requestsCount = followRequests.length;
				acceptedRequestsCount += requestsCount;
			} while (requestsCount === pageSize);
		});
		res.status(200).json({ acceptedRequestsCount });
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const rejectFollowRequest = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const rejectorUserId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		const followRequest = await FollowRequest.findById(followRequestId);
		if (!followRequest) {
			res.status(404).send(new Error("Follow request not found"));
		}
		await session.withTransaction(async () => {
			await rejectHandler(followRequest, session, rejectorUserId);
		});
		res.status(200).json({ rejected: followRequest });
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const rejectSelectedFollowRequests = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const rejectorUserId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const followRequests = await Promise.all(followRequestIds.map(id => FollowRequest.findById(id)));
			await Promise.all(followRequests.map(followRequest => rejectHandler(followRequest, session, rejectorUserId)));
		});
		res.status(200).json({ rejectedRequestIds: followRequestIds });
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const rejectAllFollowRequests = async (req, res, next) => {
	const rejectorUserId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		let rejectedRequestsCount = 0;
		let requestsCount = 0;
		await session.withTransaction(async () => {
			do {
				const followRequests = await FollowRequest.find({ user: rejectorUserId }).session(session).select({ _id: 1 }).limit(pageSize);
				await Promise.all(followRequests.map(followRequest => rejectHandler(followRequest, session, rejectorUserId)));
				requestsCount = followRequests.length;
				rejectedRequestsCount += requestsCount;
			} while (requestsCount === pageSize);
		});
		res.status(200).json({ rejectedRequestsCount });
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
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