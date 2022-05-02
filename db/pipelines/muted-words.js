"use strict";

const { ObjectId } = require("bson");

const mutedWordsAggregationPipeline = (userId, lastMuteId) => [
	{
		$match: {
			mutedBy: ObjectId(userId)
		}
	},
	{
		project: {
			word: 1,
			match: 1
		}
	}
];

module.exports = mutedWordsAggregationPipeline;