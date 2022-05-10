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