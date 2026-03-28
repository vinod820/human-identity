"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VoteCard, type Candidate } from "@/components/VoteCard";
import { generateProof, getElection, submitVote } from "@/lib/api";
import { loadState, saveState } from "@/lib/storage";

export default function VotePage() {
  const [did, setDid] = useState("");
  const [title, setTitle] = useState("Loading election...");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [message, setMessage] = useState("Vote once using the identity wallet DID.");

  useEffect(() => {
    const state = loadState();
    setDid(state.did);

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
          const proofPayload = await generateProof(did, "e1");
          const data = await submitVote({
            did,
            electionId: "e1",
            candidateId: selectedCandidate,
            nullifierHash: proofPayload.nullifierHash,
            proof: proofPayload.proof
          });

          saveState({
            nullifierHash: data.vote.nullifierHash,
            receiptHash: data.vote.receiptHash,
            txHash: data.vote.txHash,
            timestamp: data.vote.timestamp
          });
          setMessage("Vote submitted successfully. The nullifier is now consumed for this election.");
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
