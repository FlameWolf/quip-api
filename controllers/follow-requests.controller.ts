"use strict";

import mongoose, { InferSchemaType, HydratedDocument } from "mongoose";
import * as usersController from "./users.controller";
import FollowRequest from "../models/follow-request.model";
import Follow from "../models/follow.model";
import { RequestHandler } from "express";

const batchSize = 65536;
type FollowRequestModel = InferSchemaType<typeof FollowRequest.schema>;

export const acceptFollowRequest: RequestHandler = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const acceptorUserId = (req.userInfo as UserInfo).userId;
	const session = await mongoose.startSession();
	try {
		const followRequest = (await FollowRequest.findOne(
			{
				user: acceptorUserId,
				_id: followRequestId
			},
			{
				requestedBy: 1
			}
		)) as FollowRequestModel;
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
	} finally {
		await session.endSession();
	}
};
export const acceptSelectedFollowRequests: RequestHandler = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const acceptorUserId = (req.userInfo as UserInfo).userId;
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
	} finally {
		await session.endSession();
	}
};
export const acceptAllFollowRequests: RequestHandler = async (req, res, next) => {
	const acceptorUserId = (req.userInfo as UserInfo).userId;
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
				const result = await Follow.bulkSave(
					followRequests.map((followRequest: Partial<HydratedDocument<FollowRequestModel>>) => {
						delete followRequest._id;
						return new Follow(followRequest);
					}),
					{ session }
				);
				batchCount = result.insertedCount;
				totalCount += batchCount;
			} while (batchCount === batchSize);
		});
		res.status(200).json({ acceptedRequestsCount: totalCount });
	} finally {
		await session.endSession();
	}
};
export const cancelFollowRequest: RequestHandler = async (req, res, next) => {
	const handle = req.params.handle;
	const cancellerUserId = (req.userInfo as UserInfo).userId;
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
};
export const rejectFollowRequest: RequestHandler = async (req, res, next) => {
	const followRequestId = req.params.requestId;
	const rejectorUserId = (req.userInfo as UserInfo).userId;
	const rejected = await FollowRequest.findOneAndDelete({
		user: rejectorUserId,
		_id: followRequestId
	});
	res.status(200).json({ rejected });
};
export const rejectSelectedFollowRequests: RequestHandler = async (req, res, next) => {
	const followRequestIds = req.body.requestIds;
	const rejectorUserId = (req.userInfo as UserInfo).userId;
	const result = await FollowRequest.deleteMany({
		user: rejectorUserId,
		_id: {
			$in: followRequestIds
		}
	});
	res.status(200).json({ rejectedRequestsCount: result.deletedCount });
};
export const rejectAllFollowRequests: RequestHandler = async (req, res, next) => {
	const rejectorUserId = (req.userInfo as UserInfo).userId;
	const result = await FollowRequest.deleteMany({ user: rejectorUserId });
	res.status(200).json({ rejectedRequestsCount: result.deletedCount });
};