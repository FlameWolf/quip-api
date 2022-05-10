"use strict";

const { ObjectId } = require("bson");
const filtersAggregationPipeline = require("./filters");
const postAggregationPipeline = require("./post");

const topmostAggregationPipeline = (userId = undefined, period = "", lastScore = undefined, lastPostId = undefined) => {
	const matchConditions = {};
	const pageConditions = {};
	const maxDate = new Date();
	switch (period.toLowerCase()) {
		case "year":
			maxDate.setFullYear(maxDate.getFullYear() - 1);
			break;
		case "month":
			maxDate.setMonth(maxDate.getMonth() - 1);
			break;
		case "week":
			maxDate.setDate(maxDate.getDate() - 7);
			break;
		case "day":
		default:
			maxDate.setDate(maxDate.getDate() - 1);
			break;
	}
	if (period !== "all") {
		Object.assign(matchConditions, {
			createdAt: {
				$gte: maxDate
			}
		});
	}
	if (lastScore && lastPostId) {
		const parsedLastScore = parseInt(lastScore);
		Object.assign(pageConditions, {
			$expr: {
				$or: [
					{
						$lt: ["$score", parsedLastScore]
					},
					{
						$and: [
							{
								$eq: ["$score", parsedLastScore]
							},
							{
								$lt: ["$_id", ObjectId(lastPostId)]
							}
						]
					}
				]
			}
		});
	}
	return [
		{
			$match: matchConditions
		},
		{
			$sort: {
				score: -1,
				createdAt: -1
			}
		},
		...filtersAggregationPipeline(userId),
		{
			$match: pageConditions
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

module.exports = topmostAggregationPipeline;