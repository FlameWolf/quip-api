"use strict";

const express = require("express");
const isNotProdEnv = process.env.NODE_ENV !== "production";
if (isNotProdEnv) {
	require("dotenv").config();
}
const jwt = require("jsonwebtoken");
require("./schemaTypes/url");
require("./schemaTypes/point");

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
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN);
	res.setHeader("Access-Control-Allow-Credentials", true);
	res.setHeader("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept, X-Slug, X-UID");
	res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, PUT, PATCH, GET, DELETE");
	next();
});
app.use(express.json());
if (isNotProdEnv) {
	require("express-oas-generator").handleResponses(app, {
		predefinedSpec: require("./swagger.json"),
		specOutputFileBehavior: "RECREATE",
		swaggerDocumentOptions: {
			customCss: ".wrapper > .block > div > span:first-child { display: none; }"
		}
	});
}
app.use((req, res, next) => {
	try {
		const authToken = req.headers.authorization?.replace(/^bearer\s+/i, "");
		req.userInfo = authToken && jwt.verify(authToken, process.env.JWT_AUTH_SECRET);
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
app.use((err, req, res, next) => {
	res.status(500).send(err);
});

module.exports = app;