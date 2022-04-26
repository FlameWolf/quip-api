const { ObjectId } = require("bson");

const activityAggregationPipeline = (userId, lastEntryId = undefined) => [
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
						_id: "$_id._id",
						post: "$_id",
						favouritedBy: 1,
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
						_id: "$_id._id",
						post: "$_id",
						quotedBy: 1,
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
						_id: "$_id._id",
						post: "$_id",
						repliedBy: 1,
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
					$group: {
						_id: "$user",
						followedBy: {
							$addToSet: "$followedBy"
						}
					}
				},
				{
					$project: {
						user: "$_id",
						followedBy: 1
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

module.exports = activityAggregationPipeline;