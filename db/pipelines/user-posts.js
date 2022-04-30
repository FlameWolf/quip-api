"use strict";

const { ObjectId } = require("bson");
const attachmentsAggregationPipeline = require("./attachments");

const userPostsAggregationPipeline = (userId, includeRepeats = false, includeReplies = false, lastPostId = undefined) => {
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
				$lt: ObjectId(lastPostId)
			}
		}),
	};
	return [
		{
			$match: {
				_id: ObjectId(userId)
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "_id",
				foreignField: "author",
				let: {
					userId: "$_id"
				},
				pipeline: [
					{
						$match: Object.keys(matchConditions).length ? matchConditions : { $expr: true }
					},
					{
						$sort: {
							createdAt: -1
						}
					},
					...(includeRepeats ?
					[
						{
							$lookup: {
								from: "posts",
								localField: "repeatPost",
								foreignField: "_id",
								let: {
									repeatedBy: "$author"
								},
								pipeline: [
									{
										$addFields: {
											repeatedBy: "$$repeatedBy",
											repeated: true
										}
									}
								],
								as: "repeatedPost"
							}
						},
						{
							$unwind: {
								path: "$repeatedPost",
								preserveNullAndEmptyArrays: true
							}
						}
					] : []),
					{
						$replaceWith: {
							$ifNull: ["$repeatedPost", "$$ROOT"]
						}
					},
					{
						$limit: 20
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
					{
						$lookup: {
							from: "favourites",
							localField: "_id",
							foreignField: "post",
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: ["$favouritedBy", "$$userId"]
										}
									}
								},
								{
									$addFields: {
										result: true
									}
								}
							],
							as: "favourited"
						}
					},
					{
						$addFields: {
							favourited: {
								$arrayElemAt: ["$favourited.result", 0]
							}
						}
					}
				],
				as: "posts"
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceWith: "$posts"
		}
	];
};

module.exports = userPostsAggregationPipeline;