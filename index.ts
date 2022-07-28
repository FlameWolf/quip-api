"use strict";

import express = require("express");
import http = require("http");
import jwt = require("jsonwebtoken");
import "./patch-router-param";
import "./schemaTypes/url";
import "./schemaTypes/point";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { AddressInfo } from "node:net";

const isNotProdEnv = process.env.NODE_ENV !== "production";
if (isNotProdEnv) {
	require("dotenv").config();
}
const expressOasGenerator = (() => {
	if (isNotProdEnv) {
		return require("express-oas-generator");
	}
})();

require("mongoose")
	.connect(process.env.DB_CONNECTION)
	.then(() => {
		console.log("Connected to the database");
	})
	.catch(() => {
		console.log("Unable to connect to the database");
	});
require("cloudinary").v2.config({
	cloud_name: process.env.CLOUD_BUCKET,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET
});

const app = express();
app.use(require("helmet")());
app.use(async (req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN as string);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept, X-Slug, X-UID");
	res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, PUT, PATCH, GET, DELETE");
	if (req.method === "OPTIONS") {
		res.status(200).send();
		return;
	}
	next();
});
app.use(express.json());
if (isNotProdEnv) {
	expressOasGenerator.handleResponses(app, {
		predefinedSpec: require("./swagger.json"),
		specOutputFileBehavior: "RECREATE",
		swaggerDocumentOptions: {
			customCss: ".wrapper > .block > div > span:first-child, section.models.is-open { display: none; }"
		}
	});
}
app.use(async (req, res, next) => {
	try {
		const authToken = req.headers.authorization?.replace(/^bearer\s+/i, "");
		req.userInfo = authToken && jwt.verify(authToken, process.env.JWT_AUTH_SECRET as string);
	} catch (err) {}
	next();
});
app.use("/", require("./routes/index.router"));
app.use("/auth", require("./routes/auth.router"));
app.use("/users", require("./routes/users.router"));
app.use("/lists", require("./routes/lists.router"));
app.use("/posts", require("./routes/posts.router"));
app.use("/search", require("./routes/search.router"));
app.use("/settings", require("./routes/settings.router"));
app.use(async (err: Error, req: Request, res: Response, next: NextFunction) => {
	res.status(500).send(err);
});
if (isNotProdEnv) {
	expressOasGenerator.handleRequests();
}

const server = http.createServer(app);
server.listen(+(process.env.PORT as string) || 4096, () => {
	console.log(`Listening on ${(server.address() as AddressInfo).port}`);
});