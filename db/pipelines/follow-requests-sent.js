"use strict";

const { ObjectId } = require("bson");
const followRequestsSentAggregationPipeline = (userId, lastFollowRequestId = undefined) => [
	{
		$match: {
			requestedBy: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "users",
			localField: "user",
			foreignField: "_id",
			pipeline: [
				{
					$project: {
						handle: 1
					}
				}
			],
			as: "user"
		}
	},
	{
		$unwind: "$user"
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
			user: 1
		}
	}
];

module.exports = followRequestsSentAggregationPipeline;