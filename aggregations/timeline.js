const { ObjectId } = require("bson");

const timelineAggregationPipeline = (userId, lastPostId = "") => [
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
				$in: ["$author", "$following"]
			}
		}
	},
	{
		$unset: "following"
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
											$concat: ["\\W+", "$word", ".*"]
										}
									},
									{
										case: {
											$eq: ["$match", "endsWith"]
										},
										then: {
											$concat: ["w*", "$word", "(\\W+|$)"]
										}
									},
									{
										case: {
											$eq: ["$match", "exact"]
										},
										then: {
											$concat: ["\\W+", "$word", "(\\W+|$)"]
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
		$unset: ["mutedWords"]
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: {
			$expr: {
				$or: [
					{
						$eq: [lastPostId, ""]
					},
					{
						$lt: ["$_id", lastPostId]
					}
				]
			}
		}
	},
	{
		$limit: 20
	},
	{
		$lookup: {
			from: "users",
			localField: "author",
			foreignField: "_id",
			as: "author"
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