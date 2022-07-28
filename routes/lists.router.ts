"use strict";

import express = require("express");
import * as userController from "../controllers/users.controller";
import * as listsController from "../controllers/lists.controller";

const router = express.Router();
router.use(require("../middleware/requireAuthentication"));
router.get("/", userController.getLists);
router.post("/create", listsController.createList);
router.post("/update", listsController.updateList);
router.post("/add-member", listsController.addMember);
router.post("/remove-member", listsController.removeMember);
router.post("/delete/:name", listsController.deleteList);
router.get("/:name/members", userController.getListMembers);
router.get("/:name/posts", listsController.getPosts);

module.exports = router;