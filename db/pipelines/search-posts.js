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
	sortBy = "match",
	dateOrder = "desc",
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
	const [dateSort, idCompare] = dateOrder === "asc" ? [1, "$gt"] : [-1, "$lt"];
	switch (sortBy) {
		case "date":
			Object.assign(sortConditions, {
				createdAt: dateSort,
				score: -1
			});
			if (lastPostId) {
				Object.assign(pageConditions, {
					lastPostId: {
						[idCompare]: ObjectId(lastPostObjectId)
					}
				});
			}
			break;
		case "popular":
		case "match":
		default:
			Object.assign(sortConditions, {
				score: -1,
				createdAt: dateSort
			});
			if (lastScore && lastPostId) {
				const parsedLastScore = parseFloat(lastScore);
				Object.assign(pageConditions, {
					$expr: {
						$or: [
							{
								$and: [
									{
										$eq: ["$score", parsedLastScore]
									},
									{
										[idCompare]: ["$_id", ObjectId(lastPostObjectId)]
									}
								]
							},
							{
								$lt: ["$score", parsedLastScore]
							}
						]
					}
				});
			}
			break;
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
		...(sortBy !== "popular" ?
		[
			{
				$addFields: {
					score: {
						$meta: "textScore"
					}
				}
			}
		] : []),
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