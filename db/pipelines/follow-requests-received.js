"use strict";

const { ObjectId } = require("bson");
const followRequestsReceivedAggregationPipeline = (userId, lastFollowRequestId = undefined) => [
	{
		$match: {
			user: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "users",
			localField: "requestedBy",
			foreignField: "_id",
			pipeline: [
				{
					$project: {
						handle: 1
					}
				}
			],
			as: "requestedBy"
		}
	},
	{
		$unwind: "$requestedBy"
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastFollowRequestId
			? {
				_id: {
					$lt: ObjectId(lastFollowRequestId)
				}
			}
			: {
				$expr: true
			}
	},
	{
		$limit: 20
	},
	{
		$project: {
			requestedBy: 1
		}
	}
];

module.exports = followRequestsReceivedAggregationPipeline;