"use strict";

const { ObjectId } = require("bson");

const mutedWordsAggregationPipeline = (userId, lastMuteId = undefined) => [
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
		project: {
			word: 1,
			match: 1
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
	}
];

module.exports = mutedWordsAggregationPipeline;