"use strict";

const { ObjectId } = require("bson");

const listMembersAggregationPipeline = (listId, lastMemberId = undefined) => [
	{
		$match: {
			list: ObjectId(listId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastMemberId
			? {
				_id: {
					$lt: ObjectId(lastMemberId)
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

module.exports = listMembersAggregationPipeline;