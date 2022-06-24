"use strict";

const { ObjectId } = require("bson");
const filtersAggregationPipeline = require("./filters");
const postAggregationPipeline = require("./post");

const postRepliesAggregationPipeline = (postId, userId = undefined, lastReplyId = undefined) => [
	{
		$match: {
			replyTo: new ObjectId(postId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	...filtersAggregationPipeline(userId),
	{
		$match: lastReplyId
			? {
				_id: {
					$lt: new ObjectId(lastReplyId)
				}
			}
			: {
				$expr: true
			}
	},
	{
		$limit: 20
	},
	...postAggregationPipeline(userId)
];

module.exports = postRepliesAggregationPipeline;