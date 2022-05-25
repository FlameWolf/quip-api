"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const nearbyPostsAggregationPipeline = ([longitude, latitude], maxDistance = 5000, userId = undefined, lastDistance = undefined, lastPostId = undefined) => {
	const pageConditions = {};
	if (lastDistance && lastPostId) {
		const parsedLastDistance = parseFloat(lastDistance);
		Object.assign(pageConditions, {
			$expr: {
				$or: [
					{
						$and: [
							{
								$eq: ["$distance", parsedLastDistance]
							},
							{
								$lt: ["$_id", ObjectId(parsedLastDistance)]
							}
						]
					},
					{
						$gt: ["$distance", parsedLastDistance]
					}
				]
			}
		});
	}
	return [
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
			$match: pageConditions
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

module.exports = nearbyPostsAggregationPipeline;