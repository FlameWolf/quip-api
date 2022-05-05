"use strict";

const { ObjectId } = require("bson");
const filtersAggregationPipeline = require("./filters");
const postAggregationPipeline = require("./post");

const topmostAggregationPipeline = (userId = undefined, period = "") => {
	let maxDate = new Date();
	switch (period.toLowerCase()) {
		case "all":
			maxDate = undefined;
			break;
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
	return [
		{
			$match: maxDate
				? {
					createdAt: {
						$gte: maxDate
					}
				}
				: {
					$expr: true
				}
		},
		...filtersAggregationPipeline(userId),
		{
			$lookup: {
				from: "favourites",
				localField: "_id",
				foreignField: "post",
				pipeline: [
					{
						$group: {
							_id: undefined,
							result: {
								$sum: 1
							}
						}
					}
				],
				as: "favouriteCount"
			}
		},
		{
			$addFields: {
				favouriteCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$favouriteCount.result", 0]
						},
						0
					]
				}
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "_id",
				foreignField: "replyTo",
				pipeline: [
					{
						$group: {
							_id: undefined,
							result: {
								$sum: 2
							}
						}
					}
				],
				as: "replyCount"
			}
		},
		{
			$addFields: {
				replyCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$replyCount.result", 0]
						},
						0
					]
				}
			}
		},
		{
			$lookup: {
				from: "attachments",
				localField: "attachments",
				foreignField: "_id",
				let: {
					postId: "$_id"
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$post", "$$postId"]
							}
						}
					},
					{
						$group: {
							_id: undefined,
							result: {
								$sum: 2
							}
						}
					}
				],
				as: "quoteCount"
			}
		},
		{
			$addFields: {
				quoteCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$quoteCount.result", 0]
						},
						0
					]
				}
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "_id",
				foreignField: "repeatPost",
				pipeline: [
					{
						$group: {
							_id: undefined,
							result: {
								$sum: 4
							}
						}
					}
				],
				as: "repeatCount"
			}
		},
		{
			$addFields: {
				repeatCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$repeatCount.result", 0]
						},
						0
					]
				}
			}
		},
		{
			$addFields: {
				score: {
					$sum: ["$favouriteCount", "$replyCount", "$quoteCount", "$repeatCount"]
				}
			}
		},
		{
			$unset: ["favouriteCount", "replyCount", "quoteCount", "repeatCount"]
		},
		{
			$sort: {
				score: -1,
				createdAt: -1
			}
		},
		{
			$unset: "score"
		},
		{
			$limit: 250
		},
		...postAggregationPipeline(userId)
	];
};

module.exports = topmostAggregationPipeline;