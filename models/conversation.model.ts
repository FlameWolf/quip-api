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
		messages: [
			{
				type: {
					oneOf: [
						{ type: ObjectId, ref: "Message", required: true },
						{
							type: new Schema({
								user: { type: ObjectId, ref: "User", required: true },
								event: {
									type: String,
									enum: ["joined", "left"],
									required: true
								}
							})
						}
					]
				}
			}
		],
		deletedFor: [{ type: ObjectId, ref: "User" }]
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