"use strict";

import express from "express";
import jwt from "jsonwebtoken";
import { emptyString } from "./library.ts";
import type { Request, Response, NextFunction } from "express-serve-static-core";
import type { AddressInfo } from "node:net";

const isNotProdEnv = process.env.NODE_ENV !== "production";
if (isNotProdEnv) {
	(await import("dotenv")).config();
}
await import("./schemaTypes/url.ts");
await import("./schemaTypes/point.ts");
(await import("mongoose"))
	.connect(process.env.DB_CONNECTION as string)
	.then(() => {
		console.log("Connected to the database");
	})
	.catch(() => {
		console.log("Unable to connect to the database");
	});
(await import("cloudinary")).v2.config({
	cloud_name: process.env.CLOUD_BUCKET,
	api_key: process.env.CLOUD_API_KEY,
	api_secret: process.env.CLOUD_API_SECRET
});
const expressOasGenerator = await (async () => {
	if (isNotProdEnv) {
		return await import("express-oas-generator-v2");
	}
})();
const allowedOrigins = process.env.ALLOW_ORIGINS || emptyString;
const app = express();
app.use((await import("helmet")).default());
app.use(async (req, res, next) => {
	const origin = req.headers.origin || emptyString;
	res.setHeader("Access-Control-Allow-Origin", (allowedOrigins.indexOf(`${origin};`) > -1 && origin) || "*");
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
	expressOasGenerator?.handleResponses(app, {
		predefinedSpec: (await import("./swagger.json", { with: { type: "json" } })).default,
		specOutputFileBehavior: "RECREATE",
		swaggerDocumentOptions: {
			customCss: ".wrapper > .block > div > span:first-child, section.models.is-open { display: none; }"
		}
	});
}
app.use(async (req, res, next) => {
	try {
		const authToken = req.headers.authorization?.replace(/^bearer\s+/i, emptyString);
		req.userInfo = authToken && jwt.verify(authToken, process.env.JWT_AUTH_SECRET as string);
	} catch {}
	next();
});
app.use("/", (await import("./routes/index.router.ts")).default);
app.use("/auth", (await import("./routes/auth.router.ts")).default);
app.use("/users", (await import("./routes/users.router.ts")).default);
app.use("/lists", (await import("./routes/lists.router.ts")).default);
app.use("/posts", (await import("./routes/posts.router.ts")).default);
app.use("/search", (await import("./routes/search.router.ts")).default);
app.use("/settings", (await import("./routes/settings.router.ts")).default);
app.use(async (err: Error, req: Request, res: Response, next: NextFunction) => {
	res.status(500).send(err);
});
if (isNotProdEnv) {
	expressOasGenerator?.handleRequests();
}
const server = (await import("http")).createServer(app);
server.listen(+(process.env.PORT as string) || 4096, () => {
	console.log(`Listening on ${(server.address() as AddressInfo).port}`);
});