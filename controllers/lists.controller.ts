"use strict";

import { ObjectId } from "bson";
import mongoose from "mongoose";
import listPostsAggregationPipeline from "../db/pipelines/list-posts";
import * as usersController from "./users.controller";
import Follow from "../models/follow.model";
import Block from "../models/block.model";
import List from "../models/list.model";
import ListMember from "../models/list-member.model";
import { RequestHandler } from "express";

export const findListPostsByNameAndOwnerId = async (listName: string, ownerId: string | ObjectId, includeRepeats = true, includeReplies = true, lastPostId?: string | ObjectId) => await List.aggregate(listPostsAggregationPipeline(listName, ownerId, includeRepeats, includeReplies, lastPostId));
export const createList: RequestHandler = async (req, res, next) => {
	const { name, includeRepeats, includeReplies } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
	const list = await new List({ name, owner: userId, includeRepeats, includeReplies }).save();
	res.status(201).json({ list });
};
export const updateList: RequestHandler = async (req, res, next) => {
	const { name, newName, includeRepeats, includeReplies } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
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
export const addMember: RequestHandler = async (req, res, next) => {
	const { name, handle } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
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
export const removeMember: RequestHandler = async (req, res, next) => {
	const { name, handle } = req.body;
	const userId = (req.userInfo as UserInfo).userId;
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
export const getPosts: RequestHandler = async (req, res, next) => {
	const name = req.params.name;
	const { includeRepeats, includeReplies, lastPostId } = req.query;
	const userId = (req.userInfo as UserInfo).userId;
	const posts = await findListPostsByNameAndOwnerId(name, userId, includeRepeats !== "false", includeReplies !== "false", lastPostId as string);
	res.status(200).json({ posts });
};
export const deleteList: RequestHandler = async (req, res, next) => {
	const name = req.params.name;
	const userId = (req.userInfo as UserInfo).userId;
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