const { ObjectId } = require("bson");

const favouritesAggregationPipeline = (userId, lastPostId = undefined) => [
	{
		$lookup: {
			from: "favourites",
			localField: "_id",
			foreignField: "post",
			pipeline: [
				{
					$match: {
						favouritedBy: ObjectId(userId)
					}
				}
			],
			as: "favourite"
		}
	},
	{
		$unwind: "$favourite"
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
		$sort: {
			"favourite.createdAt": -1
		}
	},
	{
		$unset: "favourite"
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

module.exports = favouritesAggregationPipeline;