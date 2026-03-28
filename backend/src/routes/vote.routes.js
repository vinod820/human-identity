const express = require("express");
const {
  getElectionHandler,
  generateProofHandler,
  submitVoteHandler
} = require("../controllers/vote.controller");

const router = express.Router();

router.get("/election/:id", getElectionHandler);
router.post("/generate-proof", generateProofHandler);
router.post("/submit", submitVoteHandler);

module.exports = router;
