"use strict";

const { ObjectId } = require("bson");
const followersAggregationPipeline = (userId, lastFollowId) => [
	{
		$match: {
			user: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "users",
			localField: "followedBy",
			foreignField: "_id",
			pipeline: [
				{
					$project: {
						handle: 1
					}
				}
			],
			as: "followedBy"
		}
	},
	{
		$unwind: "$followedBy"
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
		$project: {
			followedBy: 1
		}
	}
];

module.exports = followersAggregationPipeline;