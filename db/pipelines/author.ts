"use strict";

import { PipelineStage } from "mongoose";

const authorLookupAndUnwindPipeline: Array<PipelineStage> = [
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

export default authorLookupAndUnwindPipeline;