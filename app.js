"use strict";

const { isProduction } = require("./library");

if (!isProduction) {
	require("dotenv").config();
}
const mongoose = require("mongoose");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const path = require("path");

const indexRouter = require("./routes/index.routes");
const authRouter = require("./routes/auth.routes");
const usersRouter = require("./routes/users.routes");
const postsRouter = require("./routes/posts.routes");
const searchRouter = require("./routes/search.routes");
const settingsRouter = require("./routes/settings.routes");

const app = express();
if (!isProduction) {
	require("express-oas-generator").handleResponses(app, {
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

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/posts", postsRouter);
app.use("/search", searchRouter);
app.use("/settings", settingsRouter);

module.exports = app;