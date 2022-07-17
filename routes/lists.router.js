"use strict";

const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");
const listsController = require("../controllers/lists.controller");

router.use(require("../middleware/require-authentication"));
router.get("/", userController.getLists);
router.post("/create", listsController.createList);
router.post("/update", listsController.updateList);
router.post("/add-member", listsController.addMember);
router.post("/remove-member", listsController.removeMember);
router.post("/delete/:name", listsController.deleteList);
router.get("/:name/members", userController.getListMembers);
router.get("/:name/posts", listsController.getPosts);

module.exports = router;