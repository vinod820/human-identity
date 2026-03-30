"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IdentityCard } from "@/components/IdentityCard";
import { loadState, saveState } from "@/lib/storage";
import { buildIdentityTx } from "@/lib/web3";

export default function IdentityPage() {
  const [state, setState] = useState(loadState());
  const [tx, setTx] = useState("");

  useEffect(() => {
    setState(loadState());
  }, []);

  return (
    <>
      <IdentityCard
        did={state.did}
        faceHash={state.faceHash}
        phoneHash={state.phoneHash}
        identityCommitment={state.identityCommitment}
      />
      <section className="panel">
        <h2>Blockchain Registration</h2>
        <p>For the MVP scaffold, this step builds the contract call payload that MetaMask or a server relayer would submit on Polygon Amoy.</p>
        <button
          className="primary"
          type="button"
          onClick={async () => {
            const payload = await buildIdentityTx(state.identityCommitment);
            const syntheticTx = `0xidentity${Date.now().toString(16)}`;
            saveState({ txHash: syntheticTx });
            setTx(JSON.stringify({ ...payload, txHash: syntheticTx }, null, 2));
          }}
        >
          Register on Blockchain
        </button>
        {tx ? <pre className="code">{tx}</pre> : null}
        <div className="inline-actions">
          <Link href="/vote" className="button secondary">Continue to Voting</Link>
        </div>
      </section>
    </>
  );
}
