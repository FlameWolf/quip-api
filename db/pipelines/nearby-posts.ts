"use strict";

import { ObjectId } from "mongodb";
import { maxRowsPerFetch } from "../../library.ts";
import postAggregationPipeline from "./post.ts";
import type { PipelineStage } from "mongoose";
import type { Filter } from "mongodb";

const getPageConditions = (lastDistance?: string, lastPostId?: string | ObjectId): Filter<any> => {
	const pageConditions: Filter<any> = {};
	if (lastDistance && lastPostId) {
		const parsedLastDistance = parseFloat(lastDistance);
		pageConditions.$expr = {
			$or: [
				{
					$and: [
						{
							$eq: ["$distance", parsedLastDistance]
						},
						{
							$lt: ["$_id", new ObjectId(lastPostId)]
						}
					]
				},
				{
					$gt: ["$distance", parsedLastDistance]
				}
			]
		};
	}
	return pageConditions;
};
const nearbyPostsAggregationPipeline = ([longitude, latitude]: Array<string>, maxDistance: string = "5000", userId?: string | ObjectId, lastDistance?: string, lastPostId?: string | ObjectId): Array<PipelineStage> => [
	{
		$geoNear: {
			near: {
				type: "Point",
				coordinates: [parseFloat(longitude), parseFloat(latitude)]
			},
			maxDistance: parseInt(maxDistance),
			distanceField: "distance"
		}
	},
	{
		$sort: {
			distance: 1,
			createdAt: -1
		}
	},
	{
		$match: getPageConditions(lastDistance, lastPostId)
	},
	{
		$limit: maxRowsPerFetch
	},
	...postAggregationPipeline(userId)
];

export default nearbyPostsAggregationPipeline;