import { BrowserProvider, Contract } from "ethers";

const ELECTION_MANAGER_ABI = [
  "function submitVote(uint256 electionId,string candidateId,bytes32 nullifierHash,bytes32 receiptHash) external"
];

const CIVIC_PROOF_REGISTRY_ABI = [
  "function registerIdentity(bytes32 identityCommitment) external"
];

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

async function getSigner() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export async function registerIdentityOnChain(identityCommitment: string) {
  const address = process.env.NEXT_PUBLIC_CIVIC_PROOF_REGISTRY_ADDRESS;
  if (!address) {
    throw new Error("Missing NEXT_PUBLIC_CIVIC_PROOF_REGISTRY_ADDRESS");
  }
  const signer = await getSigner();
  const contract = new Contract(address, CIVIC_PROOF_REGISTRY_ABI, signer);
  const tx = await contract.registerIdentity(identityCommitment);
  const receipt = await tx.wait();
  return receipt?.hash || tx.hash;
}

export async function submitVoteOnChain(
  electionId: string,
  candidateId: string,
  nullifierHash: string,
  receiptHash: string
) {
  const address = process.env.NEXT_PUBLIC_ELECTION_MANAGER_ADDRESS;
  if (!address) {
    throw new Error("Missing NEXT_PUBLIC_ELECTION_MANAGER_ADDRESS");
  }

  const signer = await getSigner();
  const contract = new Contract(address, ELECTION_MANAGER_ABI, signer);
  const chainElectionId = Number(String(electionId).replace(/\D/g, ""));
  const tx = await contract.submitVote(chainElectionId, candidateId, nullifierHash, receiptHash);
  const receipt = await tx.wait();
  return receipt?.hash || tx.hash;
}
