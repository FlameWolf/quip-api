"use strict";

const attachmentsAggregationPipeline = [
	{
		$lookup: {
			from: "posts",
			localField: "post",
			foreignField: "_id",
			pipeline: [
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
						pipeline: [
							{
								$lookup: {
									from: "mediafiles",
									localField: "mediaFile",
									foreignField: "_id",
									as: "mediaFile"
								}
							},
							{
								$unwind: {
									path: "$mediaFile",
									preserveNullAndEmptyArrays: true
								}
							}
						],
						as: "attachments"
					}
				},
				{
					$unwind: {
						path: "$attachments",
						preserveNullAndEmptyArrays: true
					}
				}
			],
			as: "post"
		}
	},
	{
		$unwind: {
			path: "$post",
			preserveNullAndEmptyArrays: true
		}
	},
	{
		$lookup: {
			from: "mediafiles",
			localField: "mediaFile",
			foreignField: "_id",
			as: "mediaFile"
		}
	},
	{
		$unwind: {
			path: "$mediaFile",
			preserveNullAndEmptyArrays: true
		}
	}
];

module.exports = attachmentsAggregationPipeline;