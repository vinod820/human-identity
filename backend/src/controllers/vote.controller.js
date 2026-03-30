const Vote = require("../models/Vote");
const { store } = require("../models/store");
const { buildVoteSubmission, submitVoteOnChain } = require("../services/blockchain.service");
const { createReceiptHash } = require("../services/hash.service");
const { generateProof, verifyProof, markVotingTokenConsumed } = require("../services/proof.service");
const { assessVoteRisk, logFraudEvent } = require("../services/fraud.service");
const { ensureFields } = require("../utils/validator");

function getElectionHandler(req, res, next) {
  try {
    const election = store.elections.find((item) => item._id === req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    return res.json(election);
  } catch (error) {
    next(error);
  }
}

function generateProofHandler(req, res, next) {
  try {
    ensureFields(req.body, ["votingToken", "electionId"]);
    res.json(generateProof(req.body.votingToken, req.body.electionId));
  } catch (error) {
    next(error);
  }
}

async function submitVoteHandler(req, res, next) {
  try {
    ensureFields(req.body, ["electionId", "candidateId", "nullifierHash", "proof"]);

    const election = store.elections.find((item) => item._id === req.body.electionId && item.isActive);
    if (!election) {
      return res.status(404).json({ message: "Election not active" });
    }

    const verification = verifyProof(req.body);
    if (!verification.isValid) {
      return res.status(400).json({ success: false, message: "Invalid proof or nullifier already used" });
    }

    const riskAssessment = assessVoteRisk(verification.identity, req.body.electionId, req.body.nullifierHash);
    if (riskAssessment.blocked) {
      logFraudEvent("vote_blocked", verification.identity?.userId || "unknown", {
        reason: riskAssessment.reason,
        electionId: req.body.electionId
      }, riskAssessment.riskScore);
      return res.status(403).json({ success: false, message: riskAssessment.reason });
    }

    const timestamp = new Date().toISOString();
    const receiptHash = createReceiptHash(
      req.body.electionId,
      req.body.candidateId,
      req.body.nullifierHash,
      timestamp
    );
    const blockchain = await submitVoteOnChain({
      electionId: req.body.electionId,
      candidateId: req.body.candidateId,
      nullifierHash: req.body.nullifierHash,
      receiptHash
    });

    const vote = new Vote({
      _id: `vote_${store.votes.length + 1}`,
      electionId: req.body.electionId,
      candidateId: req.body.candidateId,
      nullifierHash: req.body.nullifierHash,
      receiptHash,
      txHash: blockchain.txHash || `0xtx${Date.now().toString(16)}`,
      timestamp
    });

    store.votes.push(vote);
    markVotingTokenConsumed(verification.identity._id, req.body.electionId, req.body.nullifierHash);

    return res.status(201).json({
      success: true,
      vote,
      blockchain,
      blockchainPayload: buildVoteSubmission(
        req.body.electionId,
        req.body.candidateId,
        req.body.nullifierHash,
        receiptHash
      )
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getElectionHandler, generateProofHandler, submitVoteHandler };
