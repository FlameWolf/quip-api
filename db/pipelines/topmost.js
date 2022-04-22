const { ObjectId } = require("bson");

const topmostAggregationPipeline = (userId, period = "", lastPostId = undefined) => {
	const now = new Date();
	let maxDate = undefined;
	switch (period.toLowerCase()) {
		case "all":
			break;
		case "year":
			maxDate = new Date(now.setFullYear(now.getFullYear() - 1));
			break;
		case "month":
			maxDate = new Date(now.setMonth(now.getMonth() - 1));
			break;
		case "week":
			maxDate = new Date(now.setDate(now.getDate() - 7));
			break;
		case "day":
		default:
			maxDate = new Date(now.setDate(now.getDate() - 1));
			break;
	}
	return [
		{
			$match: maxDate
				? {
					createdAt: {
						$gt: maxDate
					}
				}
				: {
					$expr: true
				}
		},
		...(userId ?
		[
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
				$unset: "mutedWords"
			},
			{
				$lookup: {
					from: "favourites",
					localField: "_id",
					foreignField: "post",
					let: {
						userId: "$userId"
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
					let: {
						userId: "$userId"
					},
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
			},
			{
				$unset: "userId"
			}
		] : []),
		{
			$lookup: {
				from: "favourites",
				localField: "_id",
				foreignField: "post",
				pipeline: [
					{
						$group: {
							_id: undefined,
							result: {
								$sum: 1
							}
						}
					}
				],
				as: "favouriteCount"
			}
		},
		{
			$addFields: {
				favouriteCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$favouriteCount.result", 0]
						},
						0
					]
				}
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "_id",
				foreignField: "replyTo",
				pipeline: [
					{
						$group: {
							_id: undefined,
							result: {
								$sum: 2
							}
						}
					}
				],
				as: "replyCount"
			}
		},
		{
			$addFields: {
				replyCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$replyCount.result", 0]
						},
						0
					]
				}
			}
		},
		{
			$lookup: {
				from: "attachments",
				localField: "attachments",
				foreignField: "_id",
				let: {
					postId: "$_id"
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$post", "$$postId"]
							}
						}
					},
					{
						$group: {
							_id: undefined,
							result: {
								$sum: 2
							}
						}
					}
				],
				as: "quoteCount"
			}
		},
		{
			$addFields: {
				quoteCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$quoteCount.result", 0]
						},
						0
					]
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
						$group: {
							_id: undefined,
							result: {
								$sum: 4
							}
						}
					}
				],
				as: "repeatCount"
			}
		},
		{
			$addFields: {
				repeatCount: {
					$ifNull: [
						{
							$arrayElemAt: ["$repeatCount.result", 0]
						},
						0
					]
				}
			}
		},
		{
			$addFields: {
				score: {
					$sum: ["$favouriteCount", "$replyCount", "$quoteCount", "$repeatCount"]
				}
			}
		},
		{
			$unset: ["favouriteCount", "replyCount", "quoteCount", "repeatCount"]
		},
		{
			$sort: {
				score: -1,
				createdAt: -1
			}
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
				localField: "author",
				foreignField: "_id",
				pipeline: [
					{
						$project: {
							handle: 1,
							deactivated: 1,
							deleted: 1
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
};

module.exports = topmostAggregationPipeline;