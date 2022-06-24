"use strict";

const { ObjectId } = require("bson");

const followersAggregationPipeline = (userId, lastFollowId = undefined) => [
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
		$project: {
			followedBy: 1
		}
	}
];

module.exports = followersAggregationPipeline;