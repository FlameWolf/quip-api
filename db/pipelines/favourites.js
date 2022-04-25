const { ObjectId } = require("bson");

const favouritesAggregationPipeline = (userId, lastPostId = undefined) => [
	{
		$match: {
			_id: ObjectId(userId)
		}
	},
	{
		$lookup: {
			from: "favourites",
			localField: "_id",
			foreignField: "favouritedBy",
			let: {
				userId: "$_id"
			},
			pipeline: [
				{
					$sort: {
						createdAt: -1
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
					$replaceWith: "$post"
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
					$addFields: {
						favourited: true
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
			as: "favourites"
		}
	},
	{
		$project: {
			_id: 0,
			favourites: 1
		}
	},
	{
		$unwind: "$favourites"
	},
	{
		$replaceWith: "$favourites"
	}
];

module.exports = favouritesAggregationPipeline;