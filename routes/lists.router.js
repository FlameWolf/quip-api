"use strict";

const express = require("express");
const router = express.Router();
const userController = require("../controllers/users.controller");
const listsController = require("../controllers/lists.controller");

router.get("/", userController.getLists);
router.post("/create", listsController.createList);
router.post("/update", listsController.updateList);
router.get("/members", userController.getListMembers);
router.post("/add-member", listsController.addMember);
router.post("/remove-member", listsController.removeMember);
router.post("/delete/:name", listsController.deleteList);

module.exports = router;