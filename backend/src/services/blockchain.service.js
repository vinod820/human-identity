function buildIdentityRegistration(identityCommitment) {
  return {
    network: "Polygon Amoy",
    contract: "CivicProofRegistry",
    method: "registerIdentity",
    args: [identityCommitment]
  };
}

function buildVoteSubmission(electionId, candidateId, nullifierHash, receiptHash) {
  return {
    network: "Polygon Amoy",
    contract: "ElectionManager",
    method: "submitVote",
    args: [electionId, candidateId, nullifierHash, receiptHash]
  };
}

module.exports = { buildIdentityRegistration, buildVoteSubmission };
