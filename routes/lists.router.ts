"use strict";

import express from "express";
import requireAuthentication from "../middleware/requireAuthentication.ts";
import * as userController from "../controllers/users.controller.ts";
import * as listsController from "../controllers/lists.controller.ts";

const router = express.Router();
router.use(requireAuthentication);
router.get("/", userController.getLists);
router.post("/create", listsController.createList);
router.post("/update", listsController.updateList);
router.post("/add-member", listsController.addMember);
router.post("/remove-member", listsController.removeMember);
router.delete("/delete/{:name}", listsController.deleteList);
router.get("/{:name}/members", userController.getListMembers);
router.get("/{:name}/posts", listsController.getPosts);

export default router;