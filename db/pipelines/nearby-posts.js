"use strict";

const postAggregationPipeline = require("./post");

const nearbyPostsAggregationPipeline = (coordinates, maxDistance = 5000, userId = undefined, lastDistance = undefined, lastPostId = undefined) => {
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
						$lt: ["$distance", parsedLastDistance]
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
					coordinates
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