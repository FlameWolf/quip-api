"use strict";

import { PipelineStage } from "mongoose";
import authorLookupAndUnwindPipeline from "./author";

const messageAggregationPipeline: Array<PipelineStage> = [
	...(authorLookupAndUnwindPipeline as Array<any>),
	{
		$lookup: {
			from: "posts",
			localField: "attachments.post",
			foreignField: "_id",
			pipeline: authorLookupAndUnwindPipeline,
			as: "attachments.post"
		}
	},
	{
		$unwind: {
			path: "$attachments.post",
			preserveNullAndEmptyArrays: true
		}
	}
];

export default messageAggregationPipeline;