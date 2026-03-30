"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VoteCard, type Candidate } from "@/components/VoteCard";
import { generateProof, getElection, submitVote } from "@/lib/api";
import { loadState, saveState } from "@/lib/storage";
import { submitVoteOnChain } from "@/lib/web3";

export default function VotePage() {
  const [votingToken, setVotingToken] = useState("");
  const [title, setTitle] = useState("Loading election...");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [message, setMessage] = useState("Vote once using the identity wallet DID.");

  useEffect(() => {
    const state = loadState();
    setVotingToken(state.votingToken);

    getElection("e1").then((election) => {
      setTitle(election.title);
      setCandidates(election.candidates);
    });
  }, []);

  return (
    <>
      <VoteCard
        title={title}
        candidates={candidates}
        selectedCandidate={selectedCandidate}
        onSelect={setSelectedCandidate}
        onSubmit={async () => {
          if (!votingToken) {
            setMessage("No active voting token found. Complete identity verification first.");
            return;
          }
          const proofPayload = await generateProof(votingToken, "e1");
          const data = await submitVote({
            electionId: "e1",
            candidateId: selectedCandidate,
            nullifierHash: proofPayload.nullifierHash,
            proof: proofPayload.proof
          });

          let walletTxHash = "";
          try {
            walletTxHash = await submitVoteOnChain(
              "e1",
              selectedCandidate,
              data.vote.nullifierHash,
              data.vote.receiptHash
            );
          } catch (error) {
            console.warn("Wallet vote tx fallback", error);
          }

          saveState({
            nullifierHash: data.vote.nullifierHash,
            receiptHash: data.vote.receiptHash,
            txHash: walletTxHash || data.vote.txHash,
            timestamp: data.vote.timestamp
          });
          saveState({ votingToken: "" });
          setMessage("Vote submitted successfully. The token is now consumed and cannot be reused.");
        }}
      />
      <section className="panel">
        <p>{message}</p>
        <div className="inline-actions">
          <Link href="/receipt" className="button primary">Open Receipt</Link>
        </div>
      </section>
    </>
  );
}
