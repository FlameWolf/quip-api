"use strict";

const { ObjectId } = require("bson");

const votesAggregationPipeline = (userId, lastVoteId) => [
	{
		$match: {
			_id: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "votes",
			localField: "_id",
			foreignField: "user",
			pipeline: [
				{
					$sort: {
						createdAt: -1
					}
				},
				{
					$match: lastVoteId
						? {
							_id: {
								$lt: ObjectId(lastVoteId)
							}
						}
						: {
							$expr: true
						}
				},
				{
					$limit: 20
				}
			],
			as: "votes"
		}
	},
	{
		$unwind: "$votes"
	},
	{
		$replaceWith: "$votes"
	}
];

module.exports = votesAggregationPipeline;