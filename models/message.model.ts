"use strict";

import { ObjectId } from "bson";
import { Schema, SchemaTypes, model, Model, InferSchemaType } from "mongoose";
import { maxMessageLength, getUnicodeClusterCount } from "../library";

const { Url, Point } = SchemaTypes;
const messageSchema = new Schema(
	{
		conversation: { type: ObjectId, ref: "Conversation", required: true },
		content: {
			type: String,
			trim: true,
			validate: {
				validator: (value: string) => getUnicodeClusterCount(value) <= maxMessageLength,
				message: "Content length exceeds the maximum allowed limit"
			}
		},
		author: { type: ObjectId, ref: "User", required: true },
		attachments: new Schema({
			mediaFile: new Schema({
				fileType: {
					type: String,
					enum: ["image", "video"],
					required: true
				},
				src: { type: Url, required: true },
				previewSrc: { type: Url },
				description: { type: String, trim: true }
			}),
			post: { type: ObjectId, ref: "Post" }
		}),
		languages: {
			type: [
				{
					type: String,
					trim: true,
					validate: {
						validator: (value: string) => value.length === 2,
						message: "Language code must be exactly two characters long"
					}
				}
			]
		},
		location: { type: Point, index: "2dsphere" },
		mentions: {
			type: [{ type: ObjectId, ref: "User" }],
			default: undefined
		},
		hashtags: {
			type: [{ type: String }],
			default: undefined
		},
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
messageSchema.index({ createdAt: -1 });

export default model<Document, Model<InferSchemaType<typeof messageSchema>>>("Message", messageSchema);