"use strict";

const { ObjectId } = require("bson");
const followRequestsReceivedAggregationPipeline = (userId, lastFollowRequestId = undefined) => [
	{
		$match: {
			user: ObjectId(userId)
		}
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
		$project: {
			requestedBy: 1
		}
	}
];

module.exports = followRequestsReceivedAggregationPipeline;