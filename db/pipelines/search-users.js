"use strict";

const { ObjectId } = require("bson");
const userAggregationPipeline = require("./user");

const getMatchExpression = (match, searchText) => {
	switch (match) {
		case "contains":
			return new RegExp(`${searchText}`, "i");
		case "exact":
			return new RegExp(`^${searchText}$`, "i");
		case "endsWith":
			return new RegExp(`${searchText}$`, "i");
		case "startsWith":
		default:
			return new RegExp(`^${searchText}`, "i");
	}
};
const searchUsersAggregationPipeline = (searchText, match = "startsWith", dateOrder = "desc", selfId = undefined, lastUserId = undefined) => {
	const sortConditions = {};
	const pageConditions = {};
	const [dateSort, idCompare] = dateOrder === "asc" ? [1, "$gt"] : [-1, "$lt"];
	sortConditions.createdAt = dateSort;
	if (lastUserId) {
		pageConditions._id = { [idCompare]: new ObjectId(lastUserId) };
	}
	return [
		{
			$match: {
				handle: getMatchExpression(match, searchText),
				deleted: false
			}
		},
		{
			$sort: sortConditions
		},
		{
			$match: pageConditions
		},
		{
			$limit: 20
		},
		...userAggregationPipeline(selfId)
	];
};

module.exports = searchUsersAggregationPipeline;