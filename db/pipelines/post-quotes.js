"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const postQuotesAggregationPipeline = (postId, userId, lastQuoteId) => [
	{
		$match: {
			"attachments.post": new ObjectId(postId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastQuoteId
			? {
				_id: {
					$lt: new ObjectId(lastQuoteId)
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

module.exports = postQuotesAggregationPipeline;