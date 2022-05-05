"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const bookmarksAggregationPipeline = (userId, lastBookmarkId = undefined) => [
	{
		$match: {
			_id: ObjectId(userId)
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
					$lookup: {
						from: "posts",
						localField: "post",
						foreignField: "_id",
						pipeline: [
							...postAggregationPipeline(userId),
							{
								$addFields: {
									bookmarked: true
								}
							}
						],
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
		$replaceWith: "$bookmarks"
	},
	{
		$match: lastBookmarkId
			? {
				_id: {
					$lt: ObjectId(lastBookmarkId)
				}
			}
			: {
				$expr: true
			}
	},
	{
		$limit: 20
	}
];

module.exports = bookmarksAggregationPipeline;