"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");
const interactionsAggregationPipeline = require("./interactions");

const mutedPostsAggregationPipeline = (userId, lastMuteId = undefined) => [
	{
		$match: {
			mutedBy: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "posts",
			localField: "post",
			foreignField: "_id",
			pipeline: postAggregationPipeline(),
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
		$lookup: {
			from: "posts",
			localField: "post._id",
			foreignField: "_id",
			pipeline: interactionsAggregationPipeline(userId),
			as: "post"
		}
	},
	{
		$unwind: "post"
	},
	{
		$project: {
			post: 1
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
	}
];

module.exports = mutedPostsAggregationPipeline;