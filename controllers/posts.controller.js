"use strict";

const { contentLengthRegExp, urlRegExp, maxContentLength } = require("../library");
const imageThumbnail = require("image-thumbnail");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const Post = require("../models/post.model");
const MediaFile = require("../models/media-file.model");
const Attachments = require("../models/attachments.model");
const Mention = require("../models/mention.model");
const userController = require("./users.controller");

const validateContent = (content, attachment = undefined) => {
	if (!(content || attachment)) {
		throw new Error("No content");
	}
	if (content.match(contentLengthRegExp) > maxContentLength) {
		throw new Error("Content too long");
	}
};
const updateMentions = async (content, postId) => {
	for (const word of content.split(/\s+|\.+/)) {
		if (word.startsWith("@")) {
			const handle = word.replace(/\W/g, "");
			if (handle) {
				const user = await userController.findUserByHandle(handle);
				if (user) {
					new Mention({
						post: postId,
						menioned: user._id
					}).save();
				}
			}
		}
	}
};
const createMediaAttachment = async (fileName, fileType, description, protocol, host) => {
	const virtualDirectory = `${fileType}s`;
	const fileSystemDirectory = `public/${virtualDirectory}`;
	const filePath = `${fileSystemDirectory}/${fileName}`;
	const previewVirtualDirectory = `${virtualDirectory}/previews`;
	const previewFileSystemDirectory = `${fileSystemDirectory}/previews`;
	const previewFileName = `${fileName.split(".")[0]}.jpg`;
	const previewFilePath = `${previewFileSystemDirectory}/${previewFileName}`;
	const mediaFile = await new MediaFile({
		fileType,
		src: `${protocol}://${host}/${virtualDirectory}/${fileName}`,
		previewSrc: `${protocol}://${host}/${previewVirtualDirectory}/${previewFileName}`,
		description
	}).save();
	const mediaFileId = mediaFile._id;
	const errorHandler = err => {
		MediaFile.findByIdAndUpdate(mediaFileId, {
			previewSrc: null
		}).exec();
	};
	switch (fileType) {
		case "image":
			imageThumbnail(filePath, {
					responseType: "buffer",
					jpegOptions: {
						width: 800,
						height: 400,
						force: true,
						quality: 50
					}
				})
				.then(thumbnail => {
					fs.createWriteStream(previewFilePath).write(thumbnail);
				})
				.catch(errorHandler);
			break;
		case "video":
			ffmpeg(filePath)
				.screenshots({
					count: 1,
					folder: previewFileSystemDirectory,
					filename: previewFileName
				})
				.on("error", errorHandler);
			break;
		default:
			break;
	}
	return new Attachments({
		mediaFile: mediaFileId
	}).save();
};
const createPost = async (req, res, next) => {
	const { content, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	try {
		const post = await new Post({
			content,
			author: userId,
			...(media && {
				attachments: await createMediaAttachment(media.filename, req.fileType, mediaDescription, req.protocol, req.get("host"))
			})
		}).save();
		res.status(201).json({ post });
		if (content) {
			updateMentions(content, post._id);
		}
	} catch (err) {
		res.status(500).send(err);
	}
};
const getPost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		await post.populate([
			{
				path: "author"
			},
			{
				path: "attachments",
				populate: [
					{
						path: "post",
						populate: {
							path: "author"
						}
					},
					{
						path: "mediaFile"
					}
				]
			}
		]);
		res.status(200).json({ post });
	} catch (err) {
		res.status(500).send(err);
	}
};
const quotePost = async (req, res, next) => {
	const postId = req.params.postId;
	const { content, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const userId = req.userInfo.userId;
	const originalPost = await Post.findById(postId);
	if (!originalPost) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	try {
		const attachments = media ? await createMediaAttachment(media.filename, req.fileType, mediaDescription, req.protocol, req.get("host")) : new Attachments();
		attachments.post = postId;
		await attachments.save();
		const quote = await new Post({
			content,
			author: userId,
			attachments
		}).save();
		res.status(201).json({ quote });
		const quoteId = quote._id;
		new Mention({
			post: quoteId,
			mentioned: originalPost.author
		}).save();
		if (content) {
			updateMentions(content, quoteId);
		}
	} catch (err) {
		res.status(500).send(err);
	}
};
const repeatPost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	const payload = {
		author: userId,
		repeatPost: postId
	};
	try {
		if (!(await Post.findById(postId))) {
			res.status(404).send("Post not found");
			return;
		}
		await Post.deleteOne(payload);
		const repeated = await new Post(payload).save();
		res.status(201).json({ repeated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const unrepeatPost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const unrepeated = await Post.findOneAndDelete({
			author: userId,
			repeatPost: postId
		});
		res.status(200).json({ unrepeated });
	} catch (err) {
		res.status(500).send(err);
	}
};
const replyToPost = async (req, res, next) => {
	const { content, "media-description": mediaDescription } = req.body;
	const media = req.file;
	const replyTo = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		validateContent(content, media);
	} catch (err) {
		res.status(400).send(err);
		return;
	}
	const originalPost = await Post.findById(replyTo);
	if (!originalPost) {
		res.status(404).send("Post not found");
		return;
	}
	try {
		const reply = await new Post({
			content,
			author: userId,
			replyTo,
			...(media && {
				attachments: await createMediaAttachment(media.filename, req.fileType, mediaDescription, req.protocol, req.get("host"))
			})
		}).save();
		res.status(201).json({ reply });
		const replyId = reply._id;
		new Mention({
			post: replyId,
			mentioned: originalPost.author
		}).save();
		if (content) {
			updateMentions(content, replyId);
		}
	} catch (err) {
		res.status(500).send(err);
	}
};
const deletePost = async (req, res, next) => {
	const postId = req.params.postId;
	const userId = req.userInfo.userId;
	try {
		const post = await Post.findOne({
			_id: postId,
			author: userId
		});
		if (!post) {
			res.status(404).send("Post not found");
			return;
		}
		const deleted = await Post.findOneAndDelete(post);
		res.status(200).json({ deleted });
	} catch (err) {
		res.status(500).send(err);
	}
};

module.exports = {
	createPost,
	getPost,
	quotePost,
	repeatPost,
	unrepeatPost,
	replyToPost,
	deletePost
};