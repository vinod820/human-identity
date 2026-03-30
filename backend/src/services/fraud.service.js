const { store } = require("../models/store");

function logFraudEvent(type, userId, details, riskScore = 50) {
  const log = {
    _id: `fraud_${store.fraudLogs.length + 1}`,
    type,
    userId,
    details,
    riskScore,
    timestamp: new Date().toISOString()
  };

  store.fraudLogs.unshift(log);
  return log;
}

function getFraudStats() {
  return {
    totalRegistrations: store.identities.length,
    humanVerified: store.users.filter((user) => user.isHumanVerified).length,
    phoneVerified: store.users.filter((user) => user.isPhoneVerified).length,
    duplicateFaceBlocks: store.fraudLogs.filter((log) => log.type === "duplicate_face").length,
    duplicatePhoneBlocks: store.fraudLogs.filter((log) => log.type === "duplicate_phone").length,
    suspiciousAttempts: store.fraudLogs.length,
    votesCast: store.votes.length,
    nullifiersUsed: store.votes.length
  };
}

function assessVoteRisk(identity, electionId, nullifierHash) {
  if (!identity) {
    return {
      blocked: true,
      reason: "No verified identity linked to this voting token",
      riskScore: 95
    };
  }

  const suspiciousLog = store.fraudLogs.find(
    (log) => log.userId === identity.userId && log.riskScore >= 85
  );
  if (suspiciousLog) {
    return {
      blocked: true,
      reason: "Identity is flagged as suspicious",
      riskScore: suspiciousLog.riskScore
    };
  }

  const duplicateVote = store.votes.find(
    (vote) => vote.electionId === electionId && vote.nullifierHash === nullifierHash
  );
  if (duplicateVote) {
    return {
      blocked: true,
      reason: "Voting token already consumed",
      riskScore: 99
    };
  }

  return { blocked: false, reason: "clear", riskScore: 0 };
}

module.exports = { logFraudEvent, getFraudStats, assessVoteRisk };
