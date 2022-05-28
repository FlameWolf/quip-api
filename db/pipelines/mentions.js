"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");
const filtersAggregationPipeline = require("./filters");

const mentionsAggregationPipeline = (userId, lastPostId = undefined) => [
	{
		$match: {
			mentions: ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	...filtersAggregationPipeline(userId),
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
	postAggregationPipeline(userId)
];

module.exports = mentionsAggregationPipeline;