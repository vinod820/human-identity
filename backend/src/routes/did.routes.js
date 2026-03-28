const express = require("express");
const { createDidHandler } = require("../controllers/did.controller");

const router = express.Router();

router.post("/create", createDidHandler);

module.exports = router;
