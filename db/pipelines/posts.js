const { ObjectId } = require("bson");

const postsAggregationPipeline = (userId, includeRepeats = false, includeReplies = false, lastPostId = undefined) => {
	const matchConditions = [
		lastPostId && {
			_id: { $lt: ObjectId(lastPostId) }
		},
		includeRepeats && {
			repeatPost: { $ne: null }
		},
		includeReplies && {
			replyTo: { $ne: null }
		}
	].filter(x => x);
	return [
		{
			$match: {
				author: ObjectId(userId)
			}
		},
		{
			$match: matchConditions.length
				? { ...matchConditions }
				: {
					$expr: {
						$eq: [1, 1]
					}
				}
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
			$limit: 20
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

module.exports = postsAggregationPipeline;