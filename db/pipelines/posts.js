const { ObjectId } = require("bson");

const postsAggregationPipeline = (userId, includeRepeats = false, includeReplies = false, lastPostId = undefined) => {
	const matchConditions = {
		...(lastPostId && { _id: { $lt: ObjectId(lastPostId) } }),
		...(!includeRepeats && {
			repeatPost: {
				$eq: null
			}
		}),
		...(!includeReplies && {
			replyTo: {
				$eq: null
			}
		})
	};
	return [
		{
			$match: {
				_id: ObjectId(userId)
			}
		},
		{
			$lookup: {
				from: "posts",
				localField: "_id",
				foreignField: "author",
				let: {
					userId: "$_id"
				},
				pipeline: [
					{
						$match: Object.keys(matchConditions).length ? matchConditions : { $expr: true }
					},
					{
						$sort: {
							createdAt: -1
						}
					},
					...(includeRepeats ?
					[
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
											repeatedBy: "$$repeatedBy",
											repeated: true
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
						}
					] : []),
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
					},
					{
						$lookup: {
							from: "favourites",
							localField: "_id",
							foreignField: "post",
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
					}
				],
				as: "posts"
			}
		},
		{
			$unwind: "$posts"
		},
		{
			$replaceWith: "$posts"
		}
	];
};

module.exports = postsAggregationPipeline;