"use strict";

const mongoose = require("mongoose");
const batchSize = 65536;
const usersController = require("./users.controller");
const FollowRequest = require("../models/follow-request.model");
const Follow = require("../models/follow.model");

const acceptFollowRequest = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const acceptorUserId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		const followRequest = await FollowRequest.findOne(
			{
				user: acceptorUserId,
				_id: followRequestId
			},
			{
				requestedBy: 1
			}
		);
		if (!followRequest) {
			res.status(404).send(new Error("Follow request not found"));
		}
		await session.withTransaction(async () => {
			await FollowRequest.deleteOne(followRequest).session(session);
			const accepted = await new Follow({
				user: acceptorUserId,
				followedBy: followRequest.requestedBy
			}).save({ session });
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
			const filter = {
				user: acceptorUserId,
				_id: {
					$in: followRequestIds
				}
			};
			await FollowRequest.deleteMany(filter).session(session);
			const result = await Follow.bulkSave(
				(
					await FollowRequest.find(filter, {
						_id: 0,
						user: acceptorUserId,
						followedBy: "$requestedBy"
					})
				).map(followRequest => new Follow(followRequest)),
				{ session }
			);
			res.status(200).json({ acceptedRequestsCount: result.insertedCount });
		});
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
		let batchCount = 0;
		let totalCount = 0;
		await session.withTransaction(async () => {
			const filter = { user: acceptorUserId };
			do {
				const followRequests = await FollowRequest.find(filter, { user: acceptorUserId, followedBy: "$requestedBy" }).limit(batchSize).session(session);
				await FollowRequest.deleteMany({
					_id: {
						$in: followRequests.map(followRequest => followRequest._id)
					}
				}).session(session);
				followRequests.forEach(followRequest => delete followRequest._id);
				const result = await Follow.bulkSave(
					followRequests.map(followRequest => new Follow(followRequest)),
					{ session }
				);
				batchCount = result.insertedCount;
				totalCount += batchCount;
			} while (batchCount === batchSize);
		});
		res.status(200).json({ acceptedRequestsCount: totalCount });
	} catch (err) {
		next(err);
	} finally {
		await session.endSession();
	}
};
const cancelFollowRequest = async (req, res, next) => {
	const handle = req.params.handle;
	const cancellerUserId = req.userInfo.userId;
	try {
		const user = await usersController.findUserByHandle(handle);
		if (!user) {
			res.status(404).send("User not found");
			return;
		}
		const cancelled = await FollowRequest.findOneAndDelete({
			user: user._id,
			requestedBy: cancellerUserId
		});
		res.status(200).json({ cancelled });
	} catch (err) {
		next(err);
	}
};
const rejectFollowRequest = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const rejectorUserId = req.userInfo.userId;
	try {
		const rejected = await FollowRequest.findOneAndDelete({
			user: rejectorUserId,
			_id: followRequestId
		});
		res.status(200).json({ rejected });
	} catch (err) {
		next(err);
	}
};
const rejectSelectedFollowRequests = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const rejectorUserId = req.userInfo.userId;
	try {
		const result = await FollowRequest.deleteMany({
			user: rejectorUserId,
			_id: {
				$in: followRequestIds
			}
		});
		res.status(200).json({ rejectedRequestsCount: result.deletedCount });
	} catch (err) {
		next(err);
	}
};
const rejectAllFollowRequests = async (req, res, next) => {
	const rejectorUserId = req.userInfo.userId;
	try {
		const result = await FollowRequest.deleteMany({ user: rejectorUserId });
		res.status(200).json({ rejectedRequestsCount: result.deletedCount });
	} catch (err) {
		next(err);
	}
};

module.exports = {
	acceptFollowRequest,
	acceptSelectedFollowRequests,
	acceptAllFollowRequests,
	cancelFollowRequest,
	rejectFollowRequest,
	rejectSelectedFollowRequests,
	rejectAllFollowRequests
};