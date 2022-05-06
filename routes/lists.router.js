"use strict";

const express = require("express");
const router = express.Router();
const listsController = require("../controllers/lists.controller");

router.post("/create", listsController.createList);
router.post("/update", listsController.updateList);
router.post("/add-member", listsController.addMember);
router.post("/remove-member", listsController.removeMember);
router.post("/delete/:name", listsController.deleteList);

module.exports = router;