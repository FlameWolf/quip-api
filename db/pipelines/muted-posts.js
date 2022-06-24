"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const mutedPostsAggregationPipeline = (userId, lastMuteId = undefined) => [
	{
		$match: {
			mutedBy: new ObjectId(userId)
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
					$lt: new ObjectId(lastMuteId)
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
			localField: "post",
			foreignField: "_id",
			pipeline: postAggregationPipeline(userId),
			as: "post"
		}
	},
	{
		$unwind: "$post"
	},
	{
		$project: {
			post: 1
		}
	}
];

module.exports = mutedPostsAggregationPipeline;