"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ReceiptCard } from "@/components/ReceiptCard";
import { Candidate, VoteCard } from "@/components/VoteCard";
import { generateProof, getElection, submitVote } from "@/lib/api";
import { compactHash } from "@/lib/format";
import { loadState, saveState } from "@/lib/storage";
import { buildVoteTx } from "@/lib/web3";
import { loadWalletVault } from "@/lib/wallet-vault";

type ElectionRecord = {
  _id: string;
  title: string;
  description: string;
  candidates: Candidate[];
  startTime: string;
  endTime: string;
  isActive: boolean;
};

function formatElectionWindow(startTime: string, endTime: string) {
  const start = new Date(startTime).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
  const end = new Date(endTime).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${start} - ${end}`;
}

export default function VotingPage() {
  const [did, setDid] = useState("");
  const [election, setElection] = useState<ElectionRecord | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [txHash, setTxHash] = useState("");
  const [receiptHash, setReceiptHash] = useState("");
  const [nullifierHash, setNullifierHash] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const registration = loadState();
    const vault = loadWalletVault();
    const resolvedDid =
      registration.did || (vault.did && !vault.did.includes("preview-holder") ? vault.did : "");

    setDid(resolvedDid);
    setTxHash(registration.txHash);
    setReceiptHash(registration.receiptHash);
    setNullifierHash(registration.nullifierHash);
    setTimestamp(registration.timestamp);
    setPageReady(true);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getElection("e1");
        setElection(data);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Election unavailable");
      }
    })();
  }, []);

  const hasReceipt = useMemo(() => Boolean(txHash || receiptHash || nullifierHash || timestamp), [nullifierHash, receiptHash, timestamp, txHash]);

  async function handleSubmitVote() {
    if (!did) {
      setStatus("Complete identity first");
      return;
    }

    if (!election) {
      setStatus("Election unavailable");
      return;
    }

    if (!selectedCandidate) {
      setStatus("Select a candidate");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const proofResponse = await generateProof(did, election._id);
      const voteResponse = await submitVote({
        did,
        electionId: election._id,
        candidateId: selectedCandidate,
        nullifierHash: proofResponse.nullifierHash,
        proof: proofResponse.proof
      });
      const voteTx = await buildVoteTx(
        election._id,
        selectedCandidate,
        voteResponse.vote.nullifierHash,
        voteResponse.vote.receiptHash
      );

      setTxHash(voteResponse.vote.txHash || voteTx.args.join(":"));
      setReceiptHash(voteResponse.vote.receiptHash);
      setNullifierHash(voteResponse.vote.nullifierHash);
      setTimestamp(voteResponse.vote.timestamp);
      saveState({
        txHash: voteResponse.vote.txHash || voteTx.args.join(":"),
        receiptHash: voteResponse.vote.receiptHash,
        nullifierHash: voteResponse.vote.nullifierHash,
        timestamp: voteResponse.vote.timestamp
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Vote failed");
    } finally {
      setBusy(false);
    }
  }

  if (!pageReady) {
    return null;
  }

  if (!did) {
    return (
      <div className="wallet-page reveal">
        <section className="page-title-shell">
          <div className="page-title-kicker">CivicProof X</div>
          <h1 className="page-title-heading">Voting Booth</h1>
        </section>

        <section className="wallet-panel auth-required-panel">
          <div className="wallet-kicker">Identity Required</div>
          <h2>Finish identification first</h2>
          <p className="auth-copy">Complete the home verification journey before entering the voting booth.</p>
          <div className="auth-link-row">
            <Link className="btn" href="/">
              Open Home
            </Link>
            <Link className="secondary-button" href="/wallet">
              Open Wallet
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="wallet-page reveal">
      <section className="page-title-shell">
        <div className="page-title-kicker">CivicProof X</div>
        <h1 className="page-title-heading">Voting Booth</h1>
      </section>

      <section className="wallet-hero">
        <div className="wallet-hero-copy">
          <div className="wallet-kicker">Private Ballot Access</div>
          <h1>Secure Vote</h1>
          <div className="wallet-hero-actions">
            <div className="wallet-meta-pill">{compactHash(did)}</div>
            {election ? <div className="wallet-meta-pill">{election.isActive ? "Live Election" : "Closed"}</div> : null}
          </div>
        </div>

        <div className="wallet-hero-meta">
          <Link className="secondary-button" href="/">
            Home
          </Link>
          <Link className="secondary-button" href="/wallet">
            Wallet
          </Link>
        </div>
      </section>

      {status ? (
        <section className="verification-card">
          <div className="message-panel danger">
            <strong>{status}</strong>
          </div>
        </section>
      ) : null}

      {!election ? (
        <section className="wallet-panel auth-required-panel">
          <div className="wallet-kicker">Election Feed</div>
          <h2>Loading ballot</h2>
        </section>
      ) : null}

      {election && !hasReceipt ? (
        <VoteCard
          title={election.title}
          description={election.description}
          electionWindow={formatElectionWindow(election.startTime, election.endTime)}
          candidates={election.candidates}
          selectedCandidate={selectedCandidate}
          submitting={busy}
          canSubmit={Boolean(selectedCandidate && did && election.isActive)}
          onSelect={setSelectedCandidate}
          onSubmit={() => void handleSubmitVote()}
        />
      ) : null}

      {hasReceipt ? (
        <ReceiptCard
          txHash={txHash}
          receiptHash={receiptHash}
          nullifierHash={nullifierHash}
          timestamp={timestamp}
        />
      ) : null}
    </div>
  );
}
