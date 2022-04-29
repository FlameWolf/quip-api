"use strict";

const { ObjectId } = require("bson");

const activityAggregationPipeline = (userId, period = "", lastEntryId = undefined) => {
	const maxDate = new Date();
	switch (period.toLowerCase()) {
		case "month":
			maxDate.setMonth(maxDate.getMonth() - 1);
			break;
		case "week":
			maxDate.setDate(maxDate.getDate() - 7);
			break;
		case "day":
		default:
			maxDate.setDate(maxDate.getDate() - 1);
			break;
	}
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
			$addFields: {
				following: {
					$ifNull: [
						{
							$arrayElemAt: ["$following.result", 0]
						},
						[]
					]
				}
			}
		},
		{
			$lookup: {
				from: "favourites",
				localField: "following",
				foreignField: "favouritedBy",
				pipeline: [
					{
						$match: {
							createdAt: {
								$gte: maxDate
							}
						}
					},
					{
						$lookup: {
							from: "posts",
							localField: "post",
							foreignField: "_id",
							as: "post"
						}
					},
					{
						$unwind: "$post"
					},
					{
						$group: {
							_id: "$post",
							latestId: {
								$max: "$_id"
							},
							favouritedBy: {
								$addToSet: "$favouritedBy"
							},
							createdAt: {
								$max: "$createdAt"
							}
						}
					},
					{
						$project: {
							_id: "$latestId",
							post: "$_id",
							favouritedBy: {
								$size: "$favouritedBy"
							},
							createdAt: 1
						}
					}
				],
				as: "favourited"
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "following",
				foreignField: "author",
				pipeline: [
					{
						$match: {
							createdAt: {
								$gte: maxDate
							}
						}
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
										as: "post"
									}
								},
								{
									$unwind: "$post"
								}
							],
							as: "attachments"
						}
					},
					{
						$unwind: "$attachments"
					},
					{
						$group: {
							_id: "$attachments.post",
							latestId: {
								$max: "$_id"
							},
							quotedBy: {
								$addToSet: "$author"
							},
							createdAt: {
								$max: "$createdAt"
							}
						}
					},
					{
						$project: {
							_id: "$latestId",
							post: "$_id",
							quotedBy: {
								$size: "$quotedBy"
							},
							createdAt: 1
						}
					}
				],
				as: "quoted"
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "following",
				foreignField: "author",
				pipeline: [
					{
						$match: {
							createdAt: {
								$gte: maxDate
							}
						}
					},
					{
						$lookup: {
							from: "posts",
							localField: "replyTo",
							foreignField: "_id",
							as: "replyTo"
						}
					},
					{
						$unwind: "$replyTo"
					},
					{
						$group: {
							_id: "$replyTo",
							latestId: {
								$max: "$_id"
							},
							repliedBy: {
								$addToSet: "$author"
							},
							createdAt: {
								$max: "$createdAt"
							}
						}
					},
					{
						$project: {
							_id: "$latestId",
							post: "$_id",
							repliedBy: {
								$size: "$repliedBy"
							},
							createdAt: 1
						}
					}
				],
				as: "replied"
			}
		},
		{
			$lookup: {
				from: "follows",
				localField: "following",
				foreignField: "followedBy",
				pipeline: [
					{
						$match: {
							createdAt: {
								$gte: maxDate
							}
						}
					},
					{
						$group: {
							_id: "$user",
							latestId: {
								$max: "$_id"
							},
							followedBy: {
								$addToSet: "$followedBy"
							}
						}
					},
					{
						$project: {
							_id: "$latestId",
							user: "$_id",
							followedBy: {
								$size: "$followedBy"
							}
						}
					}
				],
				as: "followed"
			}
		},
		{
			$project: {
				entry: {
					$concatArrays: ["$favourited", "$quoted", "$replied", "$followed"]
				}
			}
		},
		{
			$unset: ["favourited", "quoted", "replied", "followed"]
		},
		{
			$unwind: "$entry"
		},
		{
			$lookup: {
				from: "blocks_and_mutes",
				localField: "_id",
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
								$or: [
									{
										$in: ["$entry.post.author", "$blocksAndMutes.blockedUsers"]
									},
									{
										$in: ["$entry.user", "$blocksAndMutes.blockedUsers"]
									}
								]
							}
						},
						{
							$not: {
								$or: [
									{
										$in: ["$entry.post.author", "$blocksAndMutes.mutedUsers"]
									},
									{
										$in: ["$entry.user", "$blocksAndMutes.mutedUsers"]
									}
								]
							}
						},
						{
							$not: {
								$in: ["$entry.post._id", "$blocksAndMutes.mutedPosts"]
							}
						},
						{
							$eq: [
								{
									$filter: {
										input: "$blocksAndMutes.mutedWords",
										cond: {
											$regexMatch: {
												input: "$entry.post.content",
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
			$unset: "blocksAndMutes"
		},
		{
			$sort: {
				"entry.createdAt": -1
			}
		},
		{
			$match: lastEntryId
				? {
					"entry._id": {
						$lt: ObjectId(lastEntryId)
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
				localField: "entry.user",
				foreignField: "_id",
				pipeline: [
					{
						$project: {
							handle: 1
						}
					}
				],
				as: "entry.user"
			}
		},
		{
			$unwind: {
				path: "$entry.user",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$lookup: {
				from: "users",
				localField: "entry.post.author",
				foreignField: "_id",
				pipeline: [
					{
						$project: {
							handle: 1
						}
					}
				],
				as: "entry.post.author"
			}
		},
		{
			$unwind: {
				path: "$entry.post.author",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$lookup: {
				from: "attachments",
				localField: "entry.post.attachments",
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
				],
				as: "entry.post.attachments"
			}
		},
		{
			$unwind: {
				path: "$entry.post.attachments",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$lookup: {
				from: "favourites",
				localField: "entry.post._id",
				foreignField: "post",
				let: {
					userId: "$_id"
				},
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
				"entry.post.favourited": {
					$arrayElemAt: ["$favourited.result", 0]
				}
			}
		},
		{
			$unset: "favourited"
		},
		{
			$lookup: {
				from: "posts",
				localField: "entry.post._id",
				foreignField: "repeatPost",
				let: {
					userId: "$_id"
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{
										$gt: ["$repeatPost", null]
									},
									{
										$eq: ["$author", "$$userId"]
									}
								]
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
				"entry.post.repeated": {
					$arrayElemAt: ["$repeated.result", 0]
				}
			}
		},
		{
			$unset: "repeated"
		},
		{
			$addFields: {
				"entry.post": {
					$cond: [
						{
							$eq: ["$entry.post", {}]
						},
						[],
						"$entry.post"
					]
				}
			}
		},
		{
			$unwind: {
				path: "$entry.post",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$replaceWith: "$entry"
		}
	];
};

module.exports = activityAggregationPipeline;