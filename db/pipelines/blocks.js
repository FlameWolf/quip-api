"use strict";

const { ObjectId } = require("bson");

const blocksAggregationPipeline = (userId, lastBlockId = undefined) => [
	{
		$match: {
			blockedBy: new ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastBlockId
			? {
				_id: {
					$lt: new ObjectId(lastBlockId)
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
		$project: {
			user: 1,
			reason: 1
		}
	}
];

module.exports = blocksAggregationPipeline;