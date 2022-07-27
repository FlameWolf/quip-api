"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const getPageConditions = (sortByDate, lastScore, lastPostId) => {
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
const hashtagAggregationPipeline = (hashtag, userId = undefined, sortBy = "date", lastScore = undefined, lastPostId = undefined) => {
	const sortByDate = sortBy !== "popular";
	return [
		{
			$match: {
				hashtags: hashtag
			}
		},
		{
			$sort: sortByDate ? {
				createdAt: -1,
				score: -1
			} : {
				score: -1,
				createdAt: -1
			}
		},
		{
			$match: getPageConditions(sortByDate, lastScore, lastPostId)
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

module.exports = hashtagAggregationPipeline;