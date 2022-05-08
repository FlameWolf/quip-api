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
							handle: 1
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