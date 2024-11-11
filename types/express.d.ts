"use strict";

import { Request } from "express-serve-static-core";
import { JwtPayload } from "jsonwebtoken";

declare global {
	namespace Express {
		namespace Multer {
			interface File {
				type: string;
				subType: string;
			}
		}
	}
	type MulterFile = Express.Multer.File;
}
declare module "express-serve-static-core" {
	interface Request {
		userInfo?: string | JwtPayload | UserInfo;
		file?: MulterFile;
	}
}