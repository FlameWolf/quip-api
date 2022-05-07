"use strict";

const { ObjectId } = require("bson");
const filtersAggregationPipeline = require("./filters");
const postAggregationPipeline = require("./post");

const listPostsAggregationPipeline = (listName, ownerId, includeRepeats = true, includeReplies = true, lastPostId = undefined) => {
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
		})
	};
	return [
		{
			$match: {
				name: listName,
				owner: ObjectId(ownerId)
			}
		},
		{
			$lookup: {
				from: "listmembers",
				localField: "_id",
				foreignField: "list",
				pipeline: [
					{
						$lookup: {
							from: "users",
							localField: "user",
							foreignField: "_id",
							pipeline: [
								{
									$match: {
										deactivated: false,
										deleted: false
									}
								}
							],
							as: "activeUser"
						}
					},
					{
						$unwind: "$activeUser"
					},
					{
						$group: {
							_id: undefined,
							result: {
								$addToSet: "$user"
							}
						}
					}
				],
				as: "following"
			}
		},
		{
			$lookup: {
				from: "posts",
				let: {
					following: {
						$ifNull: [
							{
								$arrayElemAt: ["$following.result", 0]
							},
							[]
						]
					}
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$in: ["$author", "$$following"]
							}
						}
					},
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
											repeatedBy: "$$repeatedBy"
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
						},
						{
							$replaceWith: {
								$ifNull: ["$repeatedPost", "$$ROOT"]
							}
						}
					] : []),
					...filtersAggregationPipeline(ownerId),
					{
						$match: lastPostId
							? {
								_id: {
									$lt: ObjectId(lastPostId)
								}
							}
							: {
								$expr: true
							}
					},
					{
						$limit: 20
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
			$replaceWith: "$posts"
		}
	];
};

module.exports = listPostsAggregationPipeline;