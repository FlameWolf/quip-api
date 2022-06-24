"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const getPageConditions = (lastDistance, lastPostId) => {
	const pageConditions = {};
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
const nearbyPostsAggregationPipeline = ([longitude, latitude], maxDistance = 5000, userId = undefined, lastDistance = undefined, lastPostId = undefined) => [
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

module.exports = nearbyPostsAggregationPipeline;