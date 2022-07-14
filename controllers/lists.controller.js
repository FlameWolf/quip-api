"use strict";

const mongoose = require("mongoose");
const listPostsAggregationPipeline = require("../db/pipelines/list-posts");
const usersController = require("./users.controller");
const Follow = require("../models/follow.model");
const Block = require("../models/block.model");
const List = require("../models/list.model");
const ListMember = require("../models/list-member.model");

const findListPostsByNameAndOwnerId = async (listName, ownerId, includeRepeats = true, includeReplies = true, lastPostId = undefined) => await List.aggregate(listPostsAggregationPipeline(listName, ownerId, includeRepeats, includeReplies, lastPostId));
const createList = async (req, res, next) => {
	const { name, includeRepeats, includeReplies } = req.body;
	const userId = req.userInfo.userId;
	const list = await new List({ name, owner: userId, includeRepeats, includeReplies }).save();
	res.status(201).json({ list });
};
const updateList = async (req, res, next) => {
	const { name, newName, includeRepeats, includeReplies } = req.body;
	const userId = req.userInfo.userId;
	const filter = { name, owner: userId };
	if (!(await List.countDocuments(filter))) {
		res.status(404).send("List not found");
		return;
	}
	if (newName && name !== newName) {
		if (await List.countDocuments({ name: newName, owner: userId })) {
			res.status(409).send("You already have another list by that name");
			return;
		}
	}
	const updated = await List.findOneAndUpdate(filter, { name: newName, includeRepeats, includeReplies }, { new: true });
	res.status(200).json({ updated });
};
const addMember = async (req, res, next) => {
	const { name, handle } = req.body;
	const userId = req.userInfo.userId;
	const list = await List.findOne({ name, owner: userId });
	if (!list) {
		res.status(404).send("List not found");
		return;
	}
	const member = await usersController.findActiveUserByHandle(handle);
	if (!member) {
		res.status(404).send("User not found");
		return;
	}
	const memberId = member._id;
	if (member.protected && !(await Follow.findOne({ user: memberId, followedBy: userId }))) {
		res.status(403).send("You are not allowed to perform this action");
		return;
	}
	if (await Block.countDocuments({ user: userId, blockedBy: memberId })) {
		res.status(403).send("User has blocked you from adding them to lists");
		return;
	}
	if (await Block.countDocuments({ user: memberId, blockedBy: userId })) {
		res.status(403).send("Unblock this user to add them to lists");
		return;
	}
	const added = await new ListMember({ list: list._id, user: memberId }).save();
	res.status(200).json({ added });
};
const removeMember = async (req, res, next) => {
	const { name, handle } = req.body;
	const userId = req.userInfo.userId;
	const list = await List.findOne({ name, owner: userId });
	if (!list) {
		res.status(404).send("List not found");
		return;
	}
	const member = await usersController.findUserByHandle(handle);
	if (!member) {
		res.status(404).send("User not found");
		return;
	}
	const memberId = member._id;
	const removed = await ListMember.findOneAndDelete({ list: list._id, user: memberId });
	res.status(200).json({ removed });
};
const getPosts = async (req, res, next) => {
	const name = req.params.name;
	const { includeRepeats, includeReplies, lastPostId } = req.query;
	const userId = req.userInfo.userId;
	const posts = await findListPostsByNameAndOwnerId(name, userId, includeRepeats, includeReplies, lastPostId);
	res.status(200).json({ posts });
};
const deleteList = async (req, res, next) => {
	const name = req.params.name;
	const userId = req.userInfo.userId;
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const deleted = await List.findOneAndDelete({ name, owner: userId }).session(session);
			if (deleted) {
				await ListMember.deleteMany({ list: deleted._id }).session(session);
			}
			res.status(200).json({ deleted });
		});
	} finally {
		await session.endSession();
	}
};

module.exports = {
	createList,
	updateList,
	addMember,
	removeMember,
	getPosts,
	deleteList
};