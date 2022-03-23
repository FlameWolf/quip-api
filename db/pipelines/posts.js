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
	].filter(x => Boolean(x));
	return [
		{
			$match: {
				author: ObjectId(userId)
			}
		},
		{
			$lookup: {
				from: "users",
				localField: "author",
				foreignField: "_id",
				pipeline: [
					{
						$match: {
							deactivated: false,
							deleted: false
						}
					},
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