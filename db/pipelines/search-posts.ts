"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const getMatchConditions = (searchText: string, searchOptions: { from?: string; since?: string; until?: string; hasMedia?: boolean; notFrom?: string; replies?: string; languages?: string; includeLanguages?: string; mediaDescription?: string }) => {
	const separator = "|";
	const atSign = "@";
	const matchConditions: Dictionary = {
		$expr: {}
	};
	if (searchText) {
		matchConditions.$text = { $search: searchText, $language: "none" };
	}
	const { from, since, until, hasMedia, notFrom, replies, languages, includeLanguages, mediaDescription } = searchOptions;
	if (from) {
		if (from.indexOf(separator) > -1) {
			matchConditions.$expr.$in = ["$author.handle", from.split(separator).map((x: string) => x.replace(atSign, ""))];
		} else {
			matchConditions.$expr.$eq = ["$author.handle", from.replace(atSign, "")];
		}
	}
	if (since) {
		matchConditions.createdAt = { $gte: new Date(since) };
	}
	if (until) {
		matchConditions.createdAt = { $lte: new Date(until) };
	}
	if (hasMedia) {
		matchConditions.$expr.$gt = ["$attachments.mediaFile", null];
	}
	if (notFrom) {
		if (notFrom.indexOf(separator) > -1) {
			matchConditions.$expr.$not = { $in: ["$author.handle", notFrom.split(separator).map((x: string) => x.replace(atSign, ""))] };
		} else {
			matchConditions.$expr.$not = { $eq: ["$author.handle", notFrom.replace(atSign, "")] };
		}
	}
	switch (replies) {
		case "exclude":
			matchConditions.replyTo = { $exists: false };
			break;
		case "only":
			matchConditions.replyTo = { $exists: true };
			break;
		default:
			break;
	}
	if (languages) {
		if (languages.indexOf(separator) > -1) {
			const languageArray = languages.split(separator);
			matchConditions.languages = { $exists: true };
			matchConditions.$expr.$setIsSubset = includeLanguages === "all" ? [languageArray, "$languages"] : ["$languages", languageArray];
		} else {
			matchConditions.languages = languages;
		}
	}
	if (mediaDescription) {
		matchConditions.attachments = {
			mediaFile: {
				description: new RegExp(mediaDescription.replace(/\s+/g, ".*?\\s+.*?"), "i")
			}
		};
	}
	return matchConditions;
};
const addScoreField = (searchText: string, sortBy: string) => {
	if (searchText && sortBy !== "popular") {
		return [
			{
				$addFields: {
					score: {
						$meta: "textScore"
					}
				}
			}
		];
	}
	return [];
};
const getSortConditions = (sortByDate: boolean, dateSort: number) =>
	sortByDate
		? {
				createdAt: dateSort,
				score: -1
		  }
		: {
				score: -1,
				createdAt: dateSort
		  };
const getPageConditions = (sortByDate: boolean, idCompare: string, lastScore?: string, lastPostId?: string | ObjectId) => {
	const pageConditions: Dictionary = {};
	if (lastPostId) {
		const lastPostObjectId = new ObjectId(lastPostId);
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
const searchPostsAggregationPipeline = (searchText: string = "", searchOptions: Dictionary = {}, sortBy: string = "match", dateOrder: string = "desc", userId?: string | ObjectId, lastScore?: string, lastPostId?: string | ObjectId) => {
	const sortByDate = sortBy === "date";
	const [dateSort, idCompare] = dateOrder === "asc" ? [1, "$gt"] : [-1, "$lt"];
	return [
		{
			$match: getMatchConditions(searchText, searchOptions)
		},
		...addScoreField(searchText, sortBy),
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

export default searchPostsAggregationPipeline;