"use strict";

const { ObjectId } = require("bson");

const searchUsersAggregationPipeline = (searchText, match = "startsWith", dateOrder = "desc", lastUserId = undefined) => {
	let matchExpr;
	const sortConditions = {};
	const pageConditions = {};
	switch (match) {
		case "exact":
			matchExpr = searchText;
			break;
		case "endsWith":
			matchExpr = new RegExp(`${searchText}$`);
			break;
		case "contains":
			matchExpr = new RegExp(`${searchText}`);
			break;
		case "startsWith":
		default:
			matchExpr = new RegExp(`^${searchText}`);
			break;
	}
	const [dateSort, idCompare] = dateOrder === "asc" ? [1, "$gt"] : [-1, "$lt"];
	Object.assign(sortConditions, {
		createdAt: dateSort
	});
	if (lastUserId) {
		Object.assign(pageConditions, {
			_id: {
				[idCompare]: ObjectId(lastUserId)
			}
		});
	}
	return [
		{
			$match: {
				handle: matchExpr,
				deleted: false
			}
		},
		{
			$project: {
				handle: 1,
				deactivated: 1,
				createdAt: 1
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
		}
	];
};

module.exports = searchUsersAggregationPipeline;