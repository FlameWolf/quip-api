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
		...interactionsAggregationPipeline(userId)
	];
};

module.exports = postAggregationPipeline;