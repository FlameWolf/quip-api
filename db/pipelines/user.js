"use strict";

const { ObjectId } = require("bson");

const userAggregationPipeline = (selfId = undefined) => {
	const emailProject = {};
	const lookupStages = [];
	if (selfId) {
		const selfObjectId = ObjectId(selfId);
		Object.assign(emailProject, { $cond: [{ $eq: ["$_id", selfObjectId] }, "$email", "$$REMOVE"] });
		lookupStages.push(
			{
				$lookup: {
					from: "blocks",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								blockedBy: selfObjectId
							}
						}
					],
					as: "blockedByMe"
				}
			},
			{
				$unwind: {
					path: "$blockedByMe",
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: "blocks",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								user: selfObjectId,
								$expr: { $eq: ["$$userId", "$blockedBy"] }
							}
						}
					],
					as: "blockedMe"
				}
			},
			{
				$unwind: {
					path: "$blockedMe",
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: "followrequests",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								requestedBy: selfObjectId
							}
						}
					],
					as: "requestedToFollowByMe"
				}
			},
			{
				$unwind: {
					path: "$requestedToFollowByMe",
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: "followrequests",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								user: selfObjectId,
								$expr: { $eq: ["$$userId", "$requestedBy"] }
							}
						}
					],
					as: "requestedToFollowMe"
				}
			},
			{
				$unwind: {
					path: "$requestedToFollowMe",
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: "follows",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								followedBy: selfObjectId
							}
						}
					],
					as: "followedByMe"
				}
			},
			{
				$unwind: {
					path: "$followedByMe",
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: "follows",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								user: selfObjectId,
								$expr: { $eq: ["$$userId", "$followedBy"] }
							}
						}
					],
					as: "followedMe"
				}
			},
			{
				$unwind: {
					path: "$followedMe",
					preserveNullAndEmptyArrays: true
				}
			},
			{
				$lookup: {
					from: "mutedusers",
					let: {
						userId: "$_id"
					},
					pipeline: [
						{
							$match: {
								$expr: { $eq: ["$$userId", "$user"] },
								mutedBy: selfObjectId
							}
						}
					],
					as: "mutedByMe"
				}
			},
			{
				$unwind: {
					path: "$mutedByMe",
					preserveNullAndEmptyArrays: true
				}
			}
		);
	} else {
		Object.assign(emailProject, { $expr: "$$REMOVE" });
	}
	return [
		{
			$project: {
				handle: 1,
				email: emailProject,
				pinnedPost: 1,
				protected: 1,
				deactivated: 1
			}
		},
		...lookupStages
	];
};

module.exports = userAggregationPipeline;