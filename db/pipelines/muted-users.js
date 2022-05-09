"use strict";

const { ObjectId } = require("bson");

const mutedUsersAggregationPipeline = (userId, lastMuteId = undefined) => [
	{
		$match: {
			mutedBy: ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastMuteId
			? {
				_id: {
					$lt: ObjectId(lastMuteId)
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
			user: 1
		}
	}
];

module.exports = mutedUsersAggregationPipeline;