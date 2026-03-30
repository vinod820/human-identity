"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { decodeSecureWalletPass, WalletSharePayload } from "@/lib/wallet-vault";

function formatExpiry(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function WalletPassClient() {
  const searchParams = useSearchParams();
  const [payload, setPayload] = useState<WalletSharePayload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "expired" | "error">("loading");

  useEffect(() => {
    const encrypted = searchParams.get("p");
    const hash = window.location.hash.replace(/^#/, "");
    const key = new URLSearchParams(hash).get("k");

    if (!encrypted || !key) {
      setState("error");
      return;
    }

    void decodeSecureWalletPass(encrypted, key)
      .then((data) => {
        if (Date.now() > data.e) {
          setState("expired");
          return;
        }

        setPayload(data);
        setState("ready");
      })
      .catch(() => {
        setState("error");
      });
  }, [searchParams]);

  return (
    <section className="wallet-pass-card">
      {state === "loading" ? (
        <div className="wallet-pass-empty">
          <div className="wallet-kicker">Secure Pass</div>
          <h1>Decrypting</h1>
        </div>
      ) : null}

      {state === "expired" ? (
        <div className="wallet-pass-empty">
          <div className="wallet-kicker">Secure Pass</div>
          <h1>Pass Expired</h1>
          <Link className="btn" href="/wallet">
            Return to Wallet
          </Link>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="wallet-pass-empty">
          <div className="wallet-kicker">Secure Pass</div>
          <h1>Invalid Pass</h1>
          <Link className="btn" href="/wallet">
            Return to Wallet
          </Link>
        </div>
      ) : null}

      {state === "ready" && payload ? (
        <>
          <div className="wallet-pass-head">
            <div>
              <div className="wallet-kicker">Credential Pass</div>
              <h1>{payload.h}</h1>
              <div className="wallet-pass-meta">{payload.w}</div>
            </div>
            <div className="vault-status-chip">Live</div>
          </div>

          <div className="wallet-pass-grid">
            <div className="wallet-pass-field">
              <span>DID</span>
              <strong>{payload.d}</strong>
            </div>
            <div className="wallet-pass-field">
              <span>Phone</span>
              <strong>{payload.p}</strong>
            </div>
            <div className="wallet-pass-field wallet-pass-field-wide">
              <span>Valid Until</span>
              <strong>{formatExpiry(payload.e)}</strong>
            </div>
          </div>

          <div className="wallet-pass-credential-list">
            {payload.c.map((credential) => (
              <article key={credential.k} className="wallet-pass-credential">
                <div className="wallet-pass-credential-top">
                  <span className="wallet-credential-badge" style={{ borderColor: credential.a, color: credential.a }}>
                    {credential.l}
                  </span>
                  <span className={`wallet-status-dot ${credential.s}`}>{credential.s}</span>
                </div>
                <strong>{credential.n}</strong>
                <span>{credential.i}</span>
                <div className="wallet-pass-scope-row">
                  {credential.p.map((scope) => (
                    <span key={scope} className="wallet-meta-pill">
                      {scope}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="wallet-pass-actions">
            <Link className="secondary-button" href="/wallet">
              Back to Wallet
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}
