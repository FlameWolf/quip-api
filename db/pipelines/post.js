"use strict";

const interactionsAggregationPipeline = require("./interactions");

const postAggregationPipeline = (userId = undefined) => {
	return [
		{
			$unset: "score"
		},
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
			$addFields: {
				"attachments.poll.expired": {
					$cond: [
						{
							$gt: ["$attachments.poll", null]
						},
						{
							$gt: [
								new Date(),
								{
									$add: ["$createdAt", "$attachments.poll.duration"]
								}
							]
						},
						"$$REMOVE"
					]
				}
			}
		},
		...interactionsAggregationPipeline(userId)
	];
};

module.exports = postAggregationPipeline;