const { ObjectId } = require("bson");

const timelineAggregationPipeline = (userId, lastPostId = undefined) => [
	{
		$lookup: {
			from: "users",
			pipeline: [
				{
					$match: {
						_id: ObjectId(userId)
					}
				},
				{
					$project: {
						_id: 1
					}
				}
			],
			as: "user"
		}
	},
	{
		$addFields: {
			userId: {
				$arrayElemAt: ["$user._id", 0]
			}
		}
	},
	{
		$unset: "user"
	},
	{
		$lookup: {
			from: "follows",
			localField: "userId",
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
		$match: {
			$expr: {
				$or: [
					{
						$in: ["$author", "$following"]
					},
					{
						$eq: ["$author", "$userId"]
					}
				]
			}
		}
	},
	{
		$unset: "following"
	},
	{
		$sort: {
			createdAt: -1
		}
	},
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
		$addFields: {
			repeatedPost: {
				$arrayElemAt: ["$repeatedPost", 0]
			}
		}
	},
	{
		$replaceWith: {
			$ifNull: ["$repeatedPost", "$$ROOT"]
		}
	},
	{
		$lookup: {
			from: "blocks",
			localField: "userId",
			foreignField: "blockedBy",
			pipeline: [
				{
					$group: {
						_id: undefined,
						result: {
							$addToSet: "$user"
						}
					}
				}
			],
			as: "blockedUsers"
		}
	},
	{
		$addFields: {
			blockedUsers: {
				$ifNull: [
					{
						$arrayElemAt: ["$blockedUsers.result", 0]
					},
					[]
				]
			}
		}
	},
	{
		$match: {
			$expr: {
				$not: {
					$in: ["$author", "$blockedUsers"]
				}
			}
		}
	},
	{
		$unset: "blockedUsers"
	},
	{
		$lookup: {
			from: "mutedusers",
			localField: "userId",
			foreignField: "mutedBy",
			pipeline: [
				{
					$group: {
						_id: undefined,
						result: {
							$addToSet: "$user"
						}
					}
				}
			],
			as: "mutedUsers"
		}
	},
	{
		$addFields: {
			mutedUsers: {
				$ifNull: [
					{
						$arrayElemAt: ["$mutedUsers.result", 0]
					},
					[]
				]
			}
		}
	},
	{
		$match: {
			$expr: {
				$not: {
					$in: ["$author", "$mutedUsers"]
				}
			}
		}
	},
	{
		$unset: "mutedUsers"
	},
	{
		$lookup: {
			from: "mutedposts",
			localField: "userId",
			foreignField: "mutedBy",
			pipeline: [
				{
					$group: {
						_id: undefined,
						result: {
							$addToSet: "$post"
						}
					}
				}
			],
			as: "mutedPosts"
		}
	},
	{
		$addFields: {
			mutedPosts: {
				$ifNull: [
					{
						$arrayElemAt: ["$mutedPosts.result", 0]
					},
					[]
				]
			}
		}
	},
	{
		$match: {
			$expr: {
				$not: {
					$in: ["$_id", "$mutedPosts"]
				}
			}
		}
	},
	{
		$unset: "mutedPosts"
	},
	{
		$lookup: {
			from: "mutedwords",
			localField: "userId",
			foreignField: "mutedBy",
			pipeline: [
				{
					$project: {
						_id: 0,
						regEx: {
							$switch: {
								branches: [
									{
										case: {
											$eq: ["$match", "startsWith"]
										},
										then: {
											$concat: ["\\b", "$word", ".*?\\b"]
										}
									},
									{
										case: {
											$eq: ["$match", "endsWith"]
										},
										then: {
											$concat: ["\\b\\w*?", "$word", "\\b"]
										}
									},
									{
										case: {
											$eq: ["$match", "exact"]
										},
										then: {
											$concat: ["\\b", "$word", "\\b"]
										}
									}
								],
								default: "$word"
							}
						}
					}
				},
				{
					$group: {
						_id: undefined,
						result: {
							$addToSet: "$regEx"
						}
					}
				}
			],
			as: "mutedWords"
		}
	},
	{
		$addFields: {
			mutedWords: {
				$ifNull: [
					{
						$arrayElemAt: ["$mutedWords.result", 0]
					},
					[]
				]
			}
		}
	},
	{
		$match: {
			$expr: {
				$eq: [
					{
						$filter: {
							input: "$mutedWords",
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
		}
	},
	{
		$unset: ["mutedWords", "userId"]
	},
	{
		$match: lastPostId ? {
			_id: {
				$lt: ObjectId(lastPostId)
			}
		} : {
			$expr: {
				$eq: [1, 1]
			}
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
		$addFields: {
			repeatedBy: {
				$arrayElemAt: ["$repeatedBy", 0]
			}
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
						as: "post"
					}
				},
				{
					$addFields: {
						post: {
							$arrayElemAt: ["$post", 0]
						}
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
					$addFields: {
						mediaFile: {
							$arrayElemAt: ["$mediaFile", 0]
						}
					}
				}
			],
			as: "attachments"
		}
	},
	{
		$addFields: {
			attachments: {
				$arrayElemAt: ["$attachments", 0]
			}
		}
	}
];

module.exports = timelineAggregationPipeline;