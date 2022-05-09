"use strict";

const interactionsAggregationPipeline = require("./interactions");

const postAggregationPipeline = (userId = undefined) => {
	return [
		{
			$lookup: {
				from: "users",
				localField: "author",
				foreignField: "_id",
				pipeline: [
					{
						$project: {
							handle: {
								$cond: ["$deleted", "[deleted]", "$handle"]
							}
						}
					}
				],
				as: "author"
			}
		},
		{
			$unwind: "$author"
		},
		{
			$lookup: {
				from: "votes",
				localField: "attachments.poll._id",
				foreignField: "poll",
				pipeline: [
					{
						$group: {
							_id: "$option",
							votes: {
								$sum: 1
							}
						}
					}
				],
				as: "results"
			}
		},
		{
			$unwind: {
				path: "$results",
				preserveNullAndEmptyArrays: true
			}
		},
		...interactionsAggregationPipeline(userId)
	];
};

module.exports = postAggregationPipeline;