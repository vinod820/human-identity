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

module.exports = { logFraudEvent, getFraudStats };
