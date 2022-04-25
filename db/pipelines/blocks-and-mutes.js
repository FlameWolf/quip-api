const blocksAndMutesPipeline = [
	{
		$lookup: {
			from: "blocks",
			localField: "_id",
			foreignField: "blockedBy",
			pipeline: [
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
		$lookup: {
			from: "mutedusers",
			localField: "_id",
			foreignField: "mutedBy",
			pipeline: [
				{
					$group: {
						_id: undefined,
						result: {
							$addToSet: "$user"
						}
					}
				}
			],
			as: "mutedUsers"
		}
	},
	{
		$addFields: {
			mutedUsers: {
				$ifNull: [
					{
						$arrayElemAt: ["$mutedUsers.result", 0]
					},
					[]
				]
			}
		}
	},
	{
		$lookup: {
			from: "mutedposts",
			localField: "_id",
			foreignField: "mutedBy",
			pipeline: [
				{
					$group: {
						_id: undefined,
						result: {
							$addToSet: "$post"
						}
					}
				}
			],
			as: "mutedPosts"
		}
	},
	{
		$addFields: {
			mutedPosts: {
				$ifNull: [
					{
						$arrayElemAt: ["$mutedPosts.result", 0]
					},
					[]
				]
			}
		}
	},
	{
		$lookup: {
			from: "mutedwords",
			localField: "_id",
			foreignField: "mutedBy",
			pipeline: [
				{
					$project: {
						_id: 0,
						regEx: {
							$switch: {
								branches: [
									{
										case: {
											$eq: ["$match", "startsWith"]
										},
										then: {
											$concat: ["\\b", "$word", ".*?\\b"]
										}
									},
									{
										case: {
											$eq: ["$match", "endsWith"]
										},
										then: {
											$concat: ["\\b\\w*?", "$word", "\\b"]
										}
									},
									{
										case: {
											$eq: ["$match", "exact"]
										},
										then: {
											$concat: ["\\b", "$word", "\\b"]
										}
									}
								],
								default: "$word"
							}
						}
					}
				},
				{
					$group: {
						_id: undefined,
						result: {
							$addToSet: "$regEx"
						}
					}
				}
			],
			as: "mutedWords"
		}
	},
	{
		$addFields: {
			mutedWords: {
				$ifNull: [
					{
						$arrayElemAt: ["$mutedWords.result", 0]
					},
					[]
				]
			}
		}
	},
	{
		$project: {
			blockedUsers: 1,
			mutedUsers: 1,
			mutedPosts: 1,
			mutedWords: 1
		}
	}
];

module.exports = blocksAndMutesPipeline;