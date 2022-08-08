"use strict";

import { ObjectId } from "bson";
import postAggregationPipeline from "./post";

const postQuotesAggregationPipeline = (postId: string | ObjectId, userId?: string | ObjectId, lastQuoteId?: string | ObjectId) => [
	{
		$match: {
			"attachments.post": new ObjectId(postId)
		}
	},
	{
		$sort: {
			createdAt: -1
		}
	},
	{
		$match: lastQuoteId
			? {
					_id: {
						$lt: new ObjectId(lastQuoteId)
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

export default postQuotesAggregationPipeline;