"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");
const filtersAggregationPipeline = require("./filters");
const interactionsAggregationPipeline = require("./interactions");

const mentionsAggregationPipeline = (userId, lastPostId) => [
	{
		$match: {
			mentioned: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "posts",
			localField: "post",
			foreignField: "_id",
			pipeline: [
				...postAggregationPipeline(),
				...filtersAggregationPipeline(userId),
				{
					$sort: {
						createdAt: -1
					}
				},
				{
					$match: lastPostId
						? {
							_id: {
								$lt: ObjectId(lastPostId)
							}
						}
						: {
							$expr: true
						}
				},
				{
					$limit: 20
				},
				...interactionsAggregationPipeline(userId)
			],
			as: "post"
		}
	},
	{
		$unwind: "$post"
	}
];

module.exports = mentionsAggregationPipeline;