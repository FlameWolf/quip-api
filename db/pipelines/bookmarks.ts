"use strict";

import { ObjectId } from "bson";
import { PipelineStage } from "mongoose";
import { maxRowsPerFetch } from "../../library";
import postAggregationPipeline from "./post";

const bookmarksAggregationPipeline = (userId: string | ObjectId, lastBookmarkId?: string | ObjectId): Array<PipelineStage> => [
	{
		$match: {
			_id: new ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "bookmarks",
			localField: "_id",
			foreignField: "bookmarkedBy",
			let: {
				userId: "$_id"
			},
			pipeline: [
				{
					$sort: {
						createdAt: -1
					}
				},
				{
					$match: lastBookmarkId
						? {
								_id: {
									$lt: new ObjectId(lastBookmarkId)
								}
							}
						: ({ $expr: true } as any)
				},
				{
					$limit: maxRowsPerFetch
				},
				{
					$lookup: {
						from: "posts",
						localField: "post",
						foreignField: "_id",
						pipeline: postAggregationPipeline(userId) as Array<any>,
						as: "post"
					}
				},
				{
					$unwind: "$post"
				},
				{
					$project: {
						post: 1
					}
				}
			],
			as: "bookmarks"
		}
	},
	{
		$unwind: "$bookmarks"
	},
	{
		$replaceRoot: {
			newRoot: "$bookmarks"
		}
	}
];

export default bookmarksAggregationPipeline;