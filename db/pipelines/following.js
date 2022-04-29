"use strict";

const { ObjectId } = require("bson");
const followingAggregationPipeline = (userId, lastFollowId = undefined) => [
	{
		$match: {
			followedBy: ObjectId(userId)
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
		$match: lastFollowId
			? {
				_id: {
					$lt: ObjectId(lastFollowId)
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

module.exports = followingAggregationPipeline;