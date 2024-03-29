"use strict";

import { ObjectId } from "bson";
import { FilterQuery, PipelineStage } from "mongoose";
import { maxCacheSize, maxRowsPerFetch } from "../../library";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const topmostAggregationPipeline = (userId?: string | ObjectId, period: string = "", lastScore?: string, lastPostId?: string | ObjectId): Array<PipelineStage> => {
	const matchConditions: FilterQuery<any> = {};
	const pageConditions: FilterQuery<any> = {};
	if (period !== "all") {
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
		matchConditions.createdAt = { $gte: maxDate };
	}
	if (lastScore && lastPostId) {
		const parsedLastScore = parseInt(lastScore);
		pageConditions.$expr = {
			$or: [
				{
					$and: [
						{
							$eq: ["$score", parsedLastScore]
						},
						{
							$lt: ["$_id", new ObjectId(lastPostId)]
						}
					]
				},
				{
					$lt: ["$score", parsedLastScore]
				}
			]
		};
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
		{
			$limit: maxCacheSize
		},
		...filtersAggregationPipeline(userId),
		{
			$match: pageConditions
		},
		{
			$limit: maxRowsPerFetch
		},
		...postAggregationPipeline(userId)
	];
};

export default topmostAggregationPipeline;