"use strict";

const attachmentsAggregationPipeline = require("./attachments");
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
		{
			$lookup: {
				from: "attachments",
				localField: "attachments",
				foreignField: "_id",
				pipeline: attachmentsAggregationPipeline,
				as: "attachments"
			}
		},
		{
			$unwind: {
				path: "$attachments",
				preserveNullAndEmptyArrays: true
			}
		},
		...interactionsAggregationPipeline(userId)
	];
};

module.exports = postAggregationPipeline;