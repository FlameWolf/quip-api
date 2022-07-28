"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const getPageConditions = (lastDistance?: string, lastPostId?: string | ObjectId) => {
	const pageConditions: Dictionary = {};
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
const nearbyPostsAggregationPipeline = ([longitude, latitude]: Array<string>, maxDistance: string = "5000", userId?: string | ObjectId, lastDistance?: string, lastPostId?: string | ObjectId) => [
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
		$limit: 20
	},
	...postAggregationPipeline(userId)
];

export default nearbyPostsAggregationPipeline;