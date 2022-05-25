"use strict";

const postAggregationPipeline = require("./post");

const hashtagAggregationPipeline = (hashtag, userId = undefined, sortBy = "date", lastScore = undefined, lastPostId = undefined) => {
	const sortByDate = sortBy !== "popular";
	const sortConditions = {};
	const pageConditions = {};
	if (sortByDate) {
		Object.assign(sortConditions, {
			createdAt: -1,
			score: -1
		});
	} else {
		Object.assign(sortConditions, {
			score: -1,
			createdAt: -1
		});
	}
	if (lastPostId) {
		const lastPostObjectId = ObjectId(lastPostId);
		if (sortByDate) {
			Object.assign(pageConditions, {
				lastPostId: {
					$lt: lastPostObjectId
				}
			});
		} else if (lastScore) {
			const parsedLastScore = parseInt(lastScore);
			Object.assign(pageConditions, {
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
			});
		}
	}
	return [
		{
			$match: {
				hashtags: hashtag
			}
		},
		{
			$sort: sortConditions
		},
		{
			$match: pageConditions
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

module.exports = hashtagAggregationPipeline;