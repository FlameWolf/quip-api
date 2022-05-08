"use strict";

const { ObjectId } = require("bson");

const interactionsAggregationPipeline = (userId = undefined) => {
	if (!userId) {
		return [];
	}
	const userObjectId = ObjectId(userId);
	return [
		{
			$lookup: {
				from: "favourites",
				localField: "_id",
				foreignField: "post",
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$favouritedBy", userObjectId]
							}
						}
					},
					{
						$addFields: {
							result: true
						}
					}
				],
				as: "favourited"
			}
		},
		{
			$addFields: {
				favourited: {
					$arrayElemAt: ["$favourited.result", 0]
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
						$match: {
							$expr: {
								$eq: ["$author", userObjectId]
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
		},
		{
			$lookup: {
				from: "votes",
				localField: "attachments.poll._id",
				foreignField: "poll",
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$user", userObjectId]
							}
						}
					},
					{
						$project: {
							option: 1
						}
					}
				],
				as: "voted"
			}
		},
		{
			$addFields: {
				voted: {
					$arrayElemAt: ["$voted.option", 0]
				}
			}
		}
	];
};

module.exports = interactionsAggregationPipeline;