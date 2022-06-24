"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const votesAggregationPipeline = (userId, lastVoteId = undefined) => [
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
					$lookup: {
						from: "posts",
						foreignField: "attachments.poll._id",
						localField: "poll",
						as: "post"
					}
				},
				{
					$unwind: "$post"
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
		$replaceWith: "$votes.post"
	},
	...postAggregationPipeline(userId)
];

module.exports = votesAggregationPipeline;