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
					$lookup: {
						from: "posts",
						localField: "post",
						foreignField: "_id",
						pipeline: [
							...postAggregationPipeline(),
							{
								$addFields: {
									favourited: true
								}
							},
							{
								$lookup: {
									from: "posts",
									localField: "_id",
									foreignField: "repeatPost",
									pipeline: [
										{
											$match: {
												$expr: {
													$eq: ["$author", "$$userId"]
												}
											}
										},
										{
											$addFields: {
												result: true
											}
										}
									],
									as: "repeated"
								}
							},
							{
								$addFields: {
									repeated: {
										$arrayElemAt: ["$repeated.result", 0]
									}
								}
							}
						],
						as: "post"
					}
				},
				{
					$unwind: "$post"
				},
				{
					$project: {
						post: 1,
						createdAt: 1
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
	}
];

module.exports = favouritesAggregationPipeline;