"use strict";

const isNotProdEnv = process.env.NODE_ENV !== "production";
if (isNotProdEnv) {
	require("dotenv").config();
}

const mongoose = require("mongoose");
require("./schemaTypes/point");
require("./schemaTypes/url");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const path = require("path");
require("./polyfills");

const indexRouter = require("./routes/index.router");
const authRouter = require("./routes/auth.router");
const usersRouter = require("./routes/users.router");
const postsRouter = require("./routes/posts.router");
const searchRouter = require("./routes/search.router");
const settingsRouter = require("./routes/settings.router");

const app = express();
if (isNotProdEnv) {
	require("express-oas-generator").handleResponses(app, {
		predefinedSpec: require("./swagger.json"),
		mongooseModels: mongoose.modelNames()
	});
}

mongoose
	.connect(process.env.DB_CONNECTION, {
		user: "admin",
		pass: "3956@tHeNgNgAaKkOlA",
		dbName: "quip-db"
	})
	.then(() => {
		console.log("Connected to the database");
	})
	.catch(() => {
		console.log("Unable to connect to the database");
	});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN);
	res.setHeader("Access-Control-Allow-Credentials", true);
	res.setHeader("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept, X-Slug, X-UID");
	res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, PUT, PATCH, GET, DELETE");
	next();
});

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/search", searchRouter);
app.use("/settings", settingsRouter);

module.exports = app;