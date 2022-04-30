"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");
const filtersAggregationPipeline = require("./filters");
const interactionsAggregationPipeline = require("./interactions");

const mentionsAggregationPipeline = (userId, lastMentionId = undefined) => [
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
				}
			],
			as: "post"
		}
	},
	{
		$unwind: "$post"
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastMentionId
			? {
				_id: {
					$lt: ObjectId(lastMentionId)
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
			from: "posts",
			localField: "post._id",
			foreignField: "_id",
			pipeline: interactionsAggregationPipeline(userId),
			as: "post"
		}
	},
	{
		$unwind: "$post"
	}
];

module.exports = mentionsAggregationPipeline;