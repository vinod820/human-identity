export async function buildIdentityTx(identityCommitment: string) {
  return {
    network: "Polygon Amoy",
    contract: "CivicProofRegistry",
    method: "registerIdentity",
    args: [identityCommitment]
  };
}

export async function buildVoteTx(electionId: string, candidateId: string, nullifierHash: string, receiptHash: string) {
  return {
    network: "Polygon Amoy",
    contract: "ElectionManager",
    method: "submitVote",
    args: [electionId, candidateId, nullifierHash, receiptHash]
  };
}
