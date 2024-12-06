"use strict";

import { ObjectId } from "bson";
import { Schema, model, Model, InferSchemaType } from "mongoose";

const conversationSchema = new Schema(
	{
		participants: [
			{
				type: ObjectId,
				ref: "User",
				required: true,
				validate: {
					validator: (value: Array<ObjectId>) => value.length > 0,
					message: "Conversation must have at least one participant"
				}
			}
		],
		messages: [{ type: ObjectId, ref: "Message", required: true }]
	},
	{
		timestamps: true,
		collation: {
			locale: "en",
			strength: 2
		}
	}
);
conversationSchema.index({ createdAt: -1 });

export default model<Document, Model<InferSchemaType<typeof conversationSchema>>>("Conversation", conversationSchema);