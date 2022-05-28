"use strict";

const { ObjectId } = require("bson");
const postAggregationPipeline = require("./post");

const getMatchConditions = searchOptions => {
	const matchConditions = {};
	if (Object.keys(searchOptions).length) {
		const separator = "|";
		const atSign = "@";
		const { from, since, until, hasMedia, notFrom } = searchOptions;
		if (from) {
			if (from.indexOf(separator) > -1) {
				matchConditions.$expr.$in = ["$author.handle", from.split(separator).map(x => x.replace(atSign, ""))];
			} else {
				matchConditions.$expr.$eq = ["$author.handle", from.replace(atSign, "")];
			}
		}
		if (since) {
			matchConditions.createdAt.$gte = new Date(since);
		}
		if (until) {
			matchConditions.createdAt.$lte = new Date(until);
		}
		if (hasMedia) {
			matchConditions.$expr.$gt = ["$attachments.mediaFile", null];
		}
		if (notFrom) {
			if (notFrom.indexOf(separator) > -1) {
				matchConditions.$expr.$not.$in = ["$author.handle", notFrom.split(separator).map(x => x.replace(atSign, ""))];
			} else {
				matchConditions.$expr.$not.$eq = ["$author.handle", notFrom.replace(atSign, "")];
			}
		}
	}
	return matchConditions;
};
const getSortConditions = (sortByDate, dateSort) =>
	sortByDate ? {
		createdAt: dateSort,
		score: -1
	} : {
		score: -1,
		createdAt: dateSort
	};
const getPageConditions = (sortByDate, idCompare, lastScore, lastPostId) => {
	const pageConditions = {};
	if (lastPostId) {
		const lastPostObjectId = ObjectId(lastPostId);
		if (sortByDate) {
			pageConditions._id[idCompare] = lastPostObjectId;
		} else if (lastScore) {
			const parsedLastScore = parseFloat(lastScore);
			pageConditions.$expr.$or = [
				{
					$and: [
						{
							$eq: ["$score", parsedLastScore]
						},
						{
							[idCompare]: ["$_id", lastPostObjectId]
						}
					]
				},
				{
					$lt: ["$score", parsedLastScore]
				}
			];
		}
	}
	return pageConditions;
};
const searchPostsAggregationPipeline = (
	searchText,
	searchOptions = {
		from: undefined,
		since: undefined,
		until: undefined,
		hasMedia: undefined,
		notFrom: undefined
	},
	sortBy = "match",
	dateOrder = "desc",
	userId = undefined,
	lastScore = undefined,
	lastPostId = undefined
) => {
	const sortByDate = sortBy === "date";
	const [dateSort, idCompare] = dateOrder === "asc" ? [1, "$gt"] : [-1, "$lt"];
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
			$match: getMatchConditions(searchOptions)
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
			$sort: getSortConditions(sortByDate, dateSort)
		},
		{
			$match: getPageConditions(sortByDate, idCompare, lastScore, lastPostId)
		},
		{
			$limit: 20
		},
		...postAggregationPipeline(userId)
	];
};

module.exports = searchPostsAggregationPipeline;