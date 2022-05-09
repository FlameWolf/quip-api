"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const searchPostsAggregationPipeline = (
	searchText,
	userId = undefined,
	searchOptions = {
		from: undefined,
		since: undefined,
		until: undefined,
		hasMedia: undefined,
		notFrom: undefined
	},
	sortByDate = false,
	lastScore = undefined,
	lastPostId = undefined
) => {
	const matchConditions = {};
	const sortConditions = {};
	const pageConditions = {};
	if (Object.keys(searchOptions).length) {
		const separator = "|";
		const atSign = "@";
		const { from, since, until, hasMedia, notFrom } = searchOptions;
		if (from) {
			if (from.indexOf(separator) > -1) {
				Object.assign(matchConditions, {
					$expr: {
						$in: ["$author.handle", from.split(separator).map(x => x.replace(atSign, ""))]
					}
				});
			} else {
				Object.assign(matchConditions, {
					$expr: {
						$eq: ["$author.handle", from.replace(atSign, "")]
					}
				});
			}
		}
		if (since) {
			const startDate = new Date(since);
			if (startDate.valueOf()) {
				Object.assign(matchConditions, {
					createdAt: {
						$gte: startDate
					}
				});
			}
		}
		if (until) {
			const endDate = new Date(until);
			if (endDate.valueOf()) {
				Object.assign(matchConditions, {
					createdAt: {
						$lte: endDate
					}
				});
			}
		}
		if (hasMedia) {
			Object.assign(matchConditions, {
				$expr: {
					$gt: ["$attachments.mediaFile", null]
				}
			});
		}
		if (notFrom) {
			if (notFrom.indexOf(separator) > -1) {
				Object.assign(matchConditions, {
					$expr: {
						$not: {
							$in: ["$author.handle", notFrom.split(separator).map(x => x.replace(atSign, ""))]
						}
					}
				});
			} else {
				Object.assign(matchConditions, {
					$expr: {
						$not: {
							$eq: ["$author.handle", notFrom.replace(atSign, "")]
						}
					}
				});
			}
		}
	}
	if (sortByDate) {
		Object.assign(sortConditions, {
			createdAt: -1,
			score: -1
		});
	} else {
		Object.assign(sortConditions, {
			score: -1,
			createdAt: -1
		});
	}
	if (lastPostId) {
		const lastPostObjectId = ObjectId(lastPostId);
		if (sortByDate) {
			Object.assign(pageConditions, {
				lastPostId: {
					$lt: lastPostObjectId
				}
			});
		} else if (lastScore) {
			const parsedLastScore = parseFloat(lastScore);
			Object.assign(pageConditions, {
				$expr: {
					$or: [
						{
							$lt: ["$score", parsedLastScore]
						},
						{
							$and: [
								{
									$eq: ["$score", parsedLastScore]
								},
								{
									$lt: ["$_id", lastPostObjectId]
								}
							]
						}
					]
				}
			});
		}
	}
	return [
		{
			$match: {
				$text: {
					$search: searchText,
					$language: "none"
				}
			}
		},
		{
			$addFields: {
				score: {
					$meta: "textScore"
				}
			}
		},
		{
			$sort: sortConditions
		},
		{
			$match: Object.assign(matchConditions, pageConditions)
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

module.exports = searchPostsAggregationPipeline;