"use strict";

const { ObjectId } = require("bson");

const blocksAggregationPipeline = (userId, lastBlockId) => [
	{
		$match: {
			blockedBy: ObjectId(userId)
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
		$project: {
			user: 1
		}
	}
];

module.exports = blocksAggregationPipeline;