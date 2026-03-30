const { ethers } = require("ethers");
const {
  amoyRpcUrl,
  backendPrivateKey,
  electionManagerAddress,
  civicProofRegistryAddress
} = require("../config/env");

const ELECTION_MANAGER_ABI = [
  "function submitVote(uint256 electionId,string calldata candidateId,bytes32 nullifierHash,bytes32 receiptHash) external",
  "function usedNullifiers(bytes32) view returns (bool)"
];

const CIVIC_PROOF_REGISTRY_ABI = [
  "function registerIdentity(bytes32 identityCommitment) external"
];

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

function createSigner() {
  if (!backendPrivateKey) {
    return null;
  }

  const provider = new ethers.JsonRpcProvider(amoyRpcUrl);
  return new ethers.Wallet(backendPrivateKey, provider);
}

async function registerIdentityOnChain(identityCommitment) {
  if (!civicProofRegistryAddress) {
    return { mode: "simulated", txHash: "", payload: buildIdentityRegistration(identityCommitment) };
  }

  const signer = createSigner();
  if (!signer) {
    return { mode: "simulated", txHash: "", payload: buildIdentityRegistration(identityCommitment) };
  }

  const contract = new ethers.Contract(civicProofRegistryAddress, CIVIC_PROOF_REGISTRY_ABI, signer);
  const tx = await contract.registerIdentity(identityCommitment);
  const receipt = await tx.wait();
  return {
    mode: "onchain",
    txHash: receipt.hash,
    payload: buildIdentityRegistration(identityCommitment)
  };
}

async function submitVoteOnChain({ electionId, candidateId, nullifierHash, receiptHash }) {
  const payload = buildVoteSubmission(electionId, candidateId, nullifierHash, receiptHash);
  if (!electionManagerAddress) {
    return { mode: "simulated", txHash: "", payload };
  }

  const signer = createSigner();
  if (!signer) {
    return { mode: "simulated", txHash: "", payload };
  }

  const contract = new ethers.Contract(electionManagerAddress, ELECTION_MANAGER_ABI, signer);
  const tx = await contract.submitVote(
    Number(String(electionId).replace(/\D/g, "")),
    candidateId,
    nullifierHash,
    receiptHash
  );
  const receipt = await tx.wait();
  return { mode: "onchain", txHash: receipt.hash, payload };
}

module.exports = {
  buildIdentityRegistration,
  buildVoteSubmission,
  registerIdentityOnChain,
  submitVoteOnChain
};
