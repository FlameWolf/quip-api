"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxCacheSize, maxRowsPerFetch } from "../../library";
import filterRepeatsAggregationPipeline from "./filter-repeats";
import filtersAggregationPipeline from "./filters";
import postAggregationPipeline from "./post";

const listPostsAggregationPipeline = (listName: string, ownerId: string | ObjectId, includeRepeats: boolean = true, includeReplies: boolean = true, lastPostId?: string | ObjectId): Array<PipelineStage> => {
	const matchConditions = {
		...(!includeRepeats && {
			repeatPost: {
				$eq: null
			}
		}),
		...(!includeReplies && {
			replyTo: {
				$eq: null
			}
		}),
		...(lastPostId && {
			_id: {
				$lt: new ObjectId(lastPostId)
			}
		})
	};
	return [
		{
			$match: {
				name: listName,
				owner: new ObjectId(ownerId)
			}
		},
		{
			$lookup: {
				from: "posts",
				let: {
					members: "$members"
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$in: ["$author", "$$members"]
							}
						}
					},
					{
						$match: Object.keys(matchConditions).length ? matchConditions : ({ $expr: true } as any)
					},
					{
						$sort: {
							createdAt: -1
						}
					},
					{
						$limit: maxCacheSize
					},
					...filterRepeatsAggregationPipeline(includeRepeats),
					...(filtersAggregationPipeline(ownerId) as Array<any>),
					{
						$match: lastPostId
							? {
									_id: {
										$lt: new ObjectId(lastPostId)
									}
								}
							: ({ $expr: true } as any)
					},
					{
						$limit: maxRowsPerFetch
					},
					{
						$lookup: {
							from: "users",
							localField: "repeatedBy",
							foreignField: "_id",
							pipeline: [
								{
									$project: {
										handle: 1
									}
								}
							],
							as: "repeatedBy"
						}
					},
					{
						$unwind: {
							path: "$repeatedBy",
							preserveNullAndEmptyArrays: true
						}
					},
					...postAggregationPipeline(ownerId)
				],
				as: "posts"
			}
		},
		{
			$project: {
				_id: 0,
				posts: 1
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceRoot: {
				newRoot: "$posts"
			}
		}
	];
};

export default listPostsAggregationPipeline;