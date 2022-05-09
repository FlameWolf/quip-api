"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const favouritesAggregationPipeline = (userId, lastFavouriteId = undefined) => [
	{
		$match: {
			_id: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "favourites",
			localField: "_id",
			foreignField: "favouritedBy",
			let: {
				userId: "$_id"
			},
			pipeline: [
				{
					$sort: {
						createdAt: -1
					}
				},
				{
					$match: lastFavouriteId
						? {
							_id: {
								$lt: ObjectId(lastFavouriteId)
							}
						}
						: {
							$expr: true
						}
				},
				{
					$limit: 20
				},
				{
					$lookup: {
						from: "posts",
						localField: "post",
						foreignField: "_id",
						pipeline: postAggregationPipeline(userId),
						as: "post"
					}
				},
				{
					$unwind: "$post"
				},
				{
					$project: {
						post: 1
					}
				}
			],
			as: "favourites"
		}
	},
	{
		$unwind: "$favourites"
	},
	{
		$replaceWith: "$favourites"
	}
];

module.exports = favouritesAggregationPipeline;