"use strict";

const interactionsAggregationPipeline = require("./interactions");

const authorLookupAndUnwind = [
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
	}
];
const postAggregationPipeline = (userId = undefined) => {
	return [
		{
			$unset: "score"
		},
		...authorLookupAndUnwind,
		{
			$lookup: {
				from: "posts",
				localField: "attachments.post",
				foreignField: "_id",
				pipeline: authorLookupAndUnwind,
				as: "attachments.post"
			}
		},
		{
			$unwind: {
				path: "$attachments.post",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$addFields: {
				attachments: {
					$cond: [
						{
							$gt: ["$attachments", null]
						},
						{
							$mergeObjects: [
								"$attachments",
								{
									poll: {
										$cond: [
											{
												$gt: ["$attachments.poll", null]
											},
											{
												$mergeObjects: [
													"$attachments.poll",
													{
														expired: {
															$gt: [
																new Date(),
																{
																	$add: ["$createdAt", "$attachments.poll.duration"]
																}
															]
														}
													}
												]
											},
											"$$REMOVE"
										]
									}
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