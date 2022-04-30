"use strict";

const { ObjectId } = require("bson");
const interactionsAggregationPipeline = require("./interactions");
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
	lastPostId = undefined
) => {
	const matchConditions = {};
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
	} else {
		Object.assign(matchConditions, {
			$expr: true
		});
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
			$sort: {
				score: {
					$meta: "textScore"
				}
			}
		},
		...postAggregationPipeline(),
		{
			$match: matchConditions
		},
		...(sortByDate ?
		[
			{
				$sort: {
					createdAt: -1
				}
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
		...interactionsAggregationPipeline(userId)
	];
};

module.exports = searchPostsAggregationPipeline;