"use strict";

const { ObjectId } = require("bson");

const timelineAggregationPipeline = (userId, includeRepeats = true, includeReplies = true, lastPostId = undefined) => {
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
		...(lastPostId && { _id: { $lt: ObjectId(lastPostId) } })
	};
	return [
		{
			$match: {
				_id: ObjectId(userId)
			}
		},
		{
			$lookup: {
				from: "follows",
				localField: "_id",
				foreignField: "followedBy",
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
					userId: "$_id",
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
								$or: [
									{
										$in: ["$author", "$$following"]
									},
									{
										$eq: ["$author", "$$userId"]
									}
								]
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
					{
						$addFields: {
							userId: "$$userId"
						}
					},
					{
						$lookup: {
							from: "blocks_and_mutes",
							localField: "userId",
							foreignField: "_id",
							as: "blocksAndMutes"
						}
					},
					{
						$unwind: {
							path: "$blocksAndMutes",
							preserveNullAndEmptyArrays: true
						}
					},
					{
						$match: {
							$expr: {
								$and: [
									{
										$not: {
											$in: ["$author", "$blocksAndMutes.blockedUsers"]
										}
									},
									{
										$not: {
											$or: [
												{
													$in: ["$author", "$blocksAndMutes.mutedUsers"]
												},
												{
													$in: ["$repeatedBy", "$blocksAndMutes.mutedUsers"]
												}
											]
										}
									},
									{
										$not: {
											$in: ["$_id", "$blocksAndMutes.mutedPosts"]
										}
									},
									{
										$eq: [
											{
												$filter: {
													input: "$blocksAndMutes.mutedWords",
													cond: {
														$regexMatch: {
															input: "$content",
															regex: "$$this",
															options: "i"
														}
													}
												}
											},
											[]
										]
									}
								]
							}
						}
					},
					{
						$unset: ["blocksAndMutes", "userId"]
					},
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
							],
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
					},
					{
						$lookup: {
							from: "posts",
							localField: "_id",
							foreignField: "repeatPost",
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: ["$author", "$$userId"]
										}
									}
								},
								{
									$addFields: {
										result: true
									}
								}
							],
							as: "repeated"
						}
					},
					{
						$addFields: {
							repeated: {
								$arrayElemAt: ["$repeated.result", 0]
							}
						}
					}
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

module.exports = timelineAggregationPipeline;