const { ObjectId } = require("bson");

const profileAggregationPipeline = (userId, lastPostId = undefined) => [
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
		$sort: {
			createdAt: -1
		}
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

module.exports = profileAggregationPipeline;