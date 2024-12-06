"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import authorLookupAndUnwindPipeline from "./author";
import interactionsAggregationPipeline from "./interactions";

const postAggregationPipeline = (userId?: string | ObjectId): Array<PipelineStage> => {
	return [
		{
			$unset: "score"
		},
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
		},
		{
			$addFields: {
				attachments: {
					$cond: [
						{
							$ne: ["$attachments", {}]
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

export default postAggregationPipeline;