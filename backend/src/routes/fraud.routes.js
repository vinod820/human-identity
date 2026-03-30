const express = require("express");
const { fraudLogsHandler, fraudStatsHandler } = require("../controllers/fraud.controller");

const router = express.Router();

router.get("/stats", fraudStatsHandler);
router.get("/logs", fraudLogsHandler);

module.exports = router;
