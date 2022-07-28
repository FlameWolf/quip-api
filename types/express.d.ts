"use strict";

import { Request } from "express-serve-static-core";
import { JwtPayload } from "jsonwebtoken";

declare global {
	type MulterFile = Express.Multer.File;
}
declare module "express-serve-static-core" {
	interface Request {
		userInfo?: string | JwtPayload | UserInfo;
		file?: MulterFile;
		fileType?: string;
		fileSubtype?: string;
	}
}