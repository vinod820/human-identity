const { store } = require("../models/store");
const { getFraudStats } = require("../services/fraud.service");

function fraudStatsHandler(_req, res) {
  res.json(getFraudStats());
}

function fraudLogsHandler(_req, res) {
  res.json(store.fraudLogs);
}

module.exports = { fraudStatsHandler, fraudLogsHandler };
