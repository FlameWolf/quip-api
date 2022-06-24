"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const postParentAggregationPipeline = (postId, userId = undefined) => [
	{
		$match: {
			_id: new ObjectId(postId)
		}
	},
	{
		$lookup: {
			from: "posts",
			localField: "replyTo",
			foreignField: "_id",
			as: "parent"
		}
	},
	{
		$unwind: "$parent"
	},
	{
		$replaceWith: "$parent"
	},
	...postAggregationPipeline(userId)
];

module.exports = postParentAggregationPipeline;