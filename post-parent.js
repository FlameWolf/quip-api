"use strict";

const { ObjectId } = require("bson");

const postParentAggregationPipeline = postId => [
	{
		$match: {
			_id: ObjectId(postId)
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
	}
];

module.exports = postParentAggregationPipeline;