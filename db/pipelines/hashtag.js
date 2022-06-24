"use strict";

const { ObjectId } = require("bson");

const postAggregationPipeline = require("./post");

const getSortConditions = sortByDate =>
	sortByDate ? {
		createdAt: -1,
		score: -1
	} : {
		score: -1,
		createdAt: -1
	};
const getPageConditions = (lastPostId, lastScore) => {
	if (lastPostId) {
		const lastPostObjectId = new ObjectId(lastPostId);
		if (sortByDate) {
			return {
				lastPostId: {
					$lt: lastPostObjectId
				}
			};
		} else if (lastScore) {
			const parsedLastScore = parseInt(lastScore);
			return {
				$expr: {
					$or: [
						{
							$and: [
								{
									$eq: ["$score", parsedLastScore]
								},
								{
									$lt: ["$_id", lastPostObjectId]
								}
							]
						},
						{
							$lt: ["$score", parsedLastScore]
						}
					]
				}
			};
		}
	}
};
const hashtagAggregationPipeline = (hashtag, userId = undefined, sortBy = "date", lastScore = undefined, lastPostId = undefined) => [
	{
		$match: {
			hashtags: hashtag
		}
	},
	{
		$sort: getSortConditions(sortBy !== "popular")
	},
	{
		$match: getPageConditions(lastPostId, lastScore)
	},
	{
		$limit: 20
	},
	...postAggregationPipeline(userId)
];

module.exports = hashtagAggregationPipeline;