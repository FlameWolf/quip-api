"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const mentionsAggregationPipeline = (userId, selfId = undefined, lastPostId = undefined) => [
	{
		$match: {
			mentions: ObjectId(userId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	...(selfId ?
	[
		{
			$lookup: {
				from: "blocks",
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: ["$blockedBy", ObjectId(selfId)]
							}
						}
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
		}
	] : []),
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
	...postAggregationPipeline(userId)
];

module.exports = mentionsAggregationPipeline;