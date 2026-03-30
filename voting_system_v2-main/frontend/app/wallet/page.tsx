"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import {
  AuthSession,
  hydrateStoredAuthSession,
  logoutAndClear
} from "@/lib/auth-client";
import {
  createSecureWalletPass,
  CredentialKind,
  getCredentialTemplate,
  loadWalletVault,
  maskCredentialNumber,
  saveWalletVault,
  upsertWalletCredential,
  WalletCredential,
  WalletVault
} from "@/lib/wallet-vault";
import { compactHash } from "@/lib/format";

type ShareState = {
  expiresAt: number;
  qrDataUrl: string;
  url: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function minutesLeft(expiresAt: number) {
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
}

export default function WalletPage() {
  const [authReady, setAuthReady] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [vault, setVault] = useState<WalletVault | null>(null);
  const [selectedKind, setSelectedKind] = useState<CredentialKind>("voter");
  const [editor, setEditor] = useState<WalletCredential | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyShare, setBusyShare] = useState(false);

  useEffect(() => {
    void hydrateStoredAuthSession().then((session) => {
      setAuthSession(session);
      const nextVault = loadWalletVault(
        session?.account
          ? {
              fullName: session.account.fullName,
              email: session.account.email,
              phone: session.account.phone
            }
          : undefined
      );
      setVault(nextVault);
      setEditor(nextVault.credentials.find((credential) => credential.kind === "voter") || null);

      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!vault || typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    setBusyShare(true);

    void (async () => {
      const pass = await createSecureWalletPass(vault, window.location.origin);
      const qrDataUrl = await QRCode.toDataURL(pass.url, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 320,
        color: {
          dark: "#E9FFFB",
          light: "#0000"
        }
      });

      if (!cancelled) {
        setShare({
          expiresAt: pass.expiresAt,
          qrDataUrl,
          url: pass.url
        });
        setBusyShare(false);
      }
    })().catch(() => {
      if (!cancelled) {
        setBusyShare(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [vault]);

  const selectedCredential = useMemo(() => {
    if (!vault) {
      return null;
    }

    return vault.credentials.find((credential) => credential.kind === selectedKind) || null;
  }, [selectedKind, vault]);

  useEffect(() => {
    if (selectedCredential) {
      setEditor(selectedCredential);
    }
  }, [selectedCredential]);

  function updateProfile(field: "holderName" | "phone" | "region", value: string) {
    if (!vault) {
      return;
    }

    const nextVault = {
      ...vault,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    setVault(nextVault);
    saveWalletVault(nextVault);
  }

  function updateEditor(field: keyof WalletCredential, value: string | boolean | string[]) {
    if (!editor) {
      return;
    }

    setEditor({
      ...editor,
      [field]: value
    });
  }

  function saveCredential() {
    if (!vault || !editor) {
      return;
    }

    const normalized: WalletCredential = {
      ...editor,
      number: editor.number.trim(),
      issuer: editor.issuer.trim(),
      issuedOn: editor.issuedOn,
      expiresOn: editor.expiresOn,
      linked: true,
      status: "verified"
    };
    const nextVault = upsertWalletCredential(vault, normalized);

    setVault(nextVault);
    setEditor(normalized);
    saveWalletVault(nextVault);
  }

  async function copyShareLink() {
    if (!share?.url) {
      return;
    }

    await navigator.clipboard.writeText(share.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleLogout() {
    await logoutAndClear();
    setAuthSession(null);
    const guestVault = loadWalletVault();
    setVault(guestVault);
    setEditor(guestVault.credentials.find((credential) => credential.kind === selectedKind) || guestVault.credentials[0] || null);
    setShare(null);
  }

  if (!authReady) {
    return null;
  }

  if (!vault || !editor) {
    return null;
  }

  const linkedCount = vault.credentials.filter((credential) => credential.linked).length;
  const voterCredential = vault.credentials.find((credential) => credential.kind === "voter");
  const aadhaarCredential = vault.credentials.find((credential) => credential.kind === "aadhaar");
  const drivingCredential = vault.credentials.find((credential) => credential.kind === "driving");
  const healthCredential = vault.credentials.find((credential) => credential.kind === "health");

  return (
    <div className="wallet-page reveal">
      <section className="page-title-shell">
        <div className="page-title-kicker">CivicProof X</div>
        <h1 className="page-title-heading">Identity Wallet</h1>
      </section>

      <section className="wallet-hero">
        <div className="wallet-hero-copy">
          <div className="wallet-kicker">Secure Identity Vault</div>
          <h1>Wallet</h1>
          <div className="wallet-hero-actions">
            <Link className="secondary-button" href="/">
              Home
            </Link>
            <div className="wallet-meta-pill">{authSession?.account.email || "Guest Vault"}</div>
            {share?.url ? (
              <Link className="btn" href={share.url}>
                Open Pass
              </Link>
            ) : null}
            {authSession ? (
              <button className="secondary-button" type="button" onClick={() => void handleLogout()}>
                Logout
              </button>
            ) : (
              <Link className="btn" href="/auth">
                Connect Account
              </Link>
            )}
          </div>
        </div>

        <div className="wallet-hero-meta">
          <div className="wallet-meta-pill">{vault.walletId}</div>
          <div className="wallet-meta-pill">{linkedCount} Credentials</div>
          <div className="wallet-meta-pill">AES-GCM Pass</div>
        </div>
      </section>

      {!authSession ? (
        <section className="wallet-panel auth-required-panel">
          <div className="wallet-kicker">Local DigiLocker Mode</div>
          <h2>Vault active on this device</h2>
          <p className="auth-copy">
            Your DID, phone, linked credentials, and secure QR pass are available now. Sign in only if you want this locker
            tied to an account profile.
          </p>
          <div className="auth-link-row">
            <Link className="btn" href="/auth">
              Sign In Or Recover
            </Link>
            <Link className="secondary-button" href="/">
              Finish Identity
            </Link>
          </div>
        </section>
      ) : null}

      <section className="wallet-grid">
        <article className="wallet-panel vault-safe-panel">
          <div className="vault-panel-head">
            <div>
              <div className="wallet-kicker">Safe Wallet View</div>
              <h2>Masked Identity Card</h2>
            </div>
            <div className="vault-status-chip">Protected</div>
          </div>

          <div className="wallet-safe-list">
            <div className="wallet-safe-item">
              <span>Name</span>
              <strong>{vault.holderName || "Civic Holder"}</strong>
            </div>
            <div className="wallet-safe-item">
              <span>Voter ID</span>
              <strong>{voterCredential?.number || "KA/2026/067214"}</strong>
            </div>
            <div className="wallet-safe-item">
              <span>Aadhaar</span>
              <strong>{maskCredentialNumber(aadhaarCredential?.number || "XXXX XXXX 9206")}</strong>
            </div>
            <div className="wallet-safe-item">
              <span>Driving License</span>
              <strong>{maskCredentialNumber(drivingCredential?.number || "DL-XXXXXXXX49646")}</strong>
            </div>
            <div className="wallet-safe-item">
              <span>Health ID</span>
              <strong>{maskCredentialNumber(healthCredential?.number || "XX-XX-XX-XX-64")}</strong>
            </div>
          </div>
        </article>

        <article className="wallet-panel vault-identity-panel">
          <div className="vault-id-top">
            <div className="vault-avatar">
              {vault.holderName
                .split(" ")
                .map((value) => value[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="vault-id-copy">
              <div className="vault-id-name">{vault.holderName}</div>
              <div className="vault-id-did">{compactHash(vault.did)}</div>
            </div>
          </div>

          <div className="vault-metric-grid">
            <div className="vault-metric-card">
              <span className="vault-metric-label">DID</span>
              <strong>{vault.did ? "Active" : "Pending"}</strong>
            </div>
            <div className="vault-metric-card">
              <span className="vault-metric-label">Phone</span>
              <strong>{vault.phone}</strong>
            </div>
            <div className="vault-metric-card">
              <span className="vault-metric-label">Face Hash</span>
              <strong>{vault.faceHash ? compactHash(vault.faceHash) : "Pending"}</strong>
            </div>
            <div className="vault-metric-card">
              <span className="vault-metric-label">Commitment</span>
              <strong>{vault.identityCommitment ? compactHash(vault.identityCommitment) : "Pending"}</strong>
            </div>
          </div>

          <div className="vault-profile-grid">
            <label className="vault-field">
              <span>Name</span>
              <input
                className="vault-input"
                value={vault.holderName}
                onChange={(event) => updateProfile("holderName", event.target.value)}
              />
            </label>
            <label className="vault-field">
              <span>Phone</span>
              <input
                className="vault-input"
                value={vault.phone}
                onChange={(event) => updateProfile("phone", event.target.value)}
              />
            </label>
            <label className="vault-field vault-field-wide">
              <span>Network</span>
              <input
                className="vault-input"
                value={vault.region}
                onChange={(event) => updateProfile("region", event.target.value)}
              />
            </label>
          </div>
        </article>

        <article className="wallet-panel vault-qr-panel">
          <div className="vault-panel-head">
            <div>
              <div className="wallet-kicker">Secure Scan Pass</div>
              <h2>Encrypted QR</h2>
            </div>
            <div className="vault-status-chip">{busyShare ? "Building" : `${minutesLeft(share?.expiresAt || Date.now())}m`}</div>
          </div>

          <div className="vault-qr-shell">
            {share?.qrDataUrl ? <img className="vault-qr-image" src={share.qrDataUrl} alt="Secure credential QR" /> : null}
          </div>

          <div className="vault-qr-actions">
            <button className="btn" type="button" onClick={() => void copyShareLink()} disabled={!share?.url}>
              {copied ? "Copied" : "Copy Link"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => vault && setVault({ ...vault, updatedAt: new Date().toISOString() })}
            >
              Refresh Pass
            </button>
          </div>
        </article>
      </section>

      <section className="wallet-credential-grid">
        {vault.credentials.map((credential) => (
          <button
            key={credential.kind}
            type="button"
            className={`wallet-credential-card ${selectedKind === credential.kind ? "active" : ""}`}
            onClick={() => setSelectedKind(credential.kind)}
          >
            <div className="wallet-credential-top">
              <span className="wallet-credential-badge" style={{ borderColor: credential.accent, color: credential.accent }}>
                {credential.shortLabel}
              </span>
              <span className={`wallet-status-dot ${credential.status}`}>{credential.status}</span>
            </div>
            <div className="wallet-credential-title">{credential.label}</div>
            <div className="wallet-credential-number">{maskCredentialNumber(credential.number)}</div>
            <div className="wallet-credential-issuer">{credential.issuer}</div>
          </button>
        ))}
      </section>

      <section className="wallet-grid wallet-grid-lower">
        <article className="wallet-panel vault-editor-panel">
          <div className="vault-panel-head">
            <div>
              <div className="wallet-kicker">Credential Details</div>
              <h2>{editor.label}</h2>
            </div>
            <div className="vault-status-chip">{editor.linked ? "Linked" : "Pending"}</div>
          </div>

          <div className="vault-input-grid">
            <label className="vault-field">
              <span>Credential No.</span>
              <input
                className="vault-input"
                value={editor.number}
                onChange={(event) => updateEditor("number", event.target.value)}
              />
            </label>
            <label className="vault-field">
              <span>Issuer</span>
              <input
                className="vault-input"
                value={editor.issuer}
                onChange={(event) => updateEditor("issuer", event.target.value)}
              />
            </label>
            <label className="vault-field">
              <span>Issued On</span>
              <input
                className="vault-input"
                type="date"
                value={editor.issuedOn}
                onChange={(event) => updateEditor("issuedOn", event.target.value)}
              />
            </label>
            <label className="vault-field">
              <span>Expires On</span>
              <input
                className="vault-input"
                type="date"
                value={editor.expiresOn}
                onChange={(event) => updateEditor("expiresOn", event.target.value)}
              />
            </label>
            <label className="vault-field vault-field-wide">
              <span>Scopes</span>
              <input
                className="vault-input"
                value={editor.scope.join(", ")}
                onChange={(event) =>
                  updateEditor(
                    "scope",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                  )
                }
              />
            </label>
          </div>

          <div className="vault-qr-actions">
            <button className="btn" type="button" onClick={saveCredential}>
              Save Credential
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setEditor(getCredentialTemplate(editor.kind))}
            >
              Reset Template
            </button>
          </div>
        </article>

        <article className="wallet-panel vault-security-panel">
          <div className="vault-panel-head">
            <div>
              <div className="wallet-kicker">Security Mesh</div>
              <h2>Share Controls</h2>
            </div>
          </div>

          <div className="vault-security-grid">
            <div className="vault-security-card">
              <span>Browser-side encryption</span>
              <strong>AES-GCM payload with integrity check</strong>
            </div>
            <div className="vault-security-card">
              <span>Fragment key split</span>
              <strong>Key stays after `#` and bypasses server logs</strong>
            </div>
            <div className="vault-security-card">
              <span>Time bound pass</span>
              <strong>{share ? `Expires in ${minutesLeft(share.expiresAt)} minutes` : "Generates on load"}</strong>
            </div>
            <div className="vault-security-card">
              <span>Credential coverage</span>
              <strong>{vault.credentials.filter((credential) => credential.linked).map((credential) => credential.label).join(" | ")}</strong>
            </div>
          </div>

          <div className="vault-timeline">
            {vault.credentials.map((credential) => (
              <div key={credential.kind} className="vault-timeline-item">
                <span>{credential.label}</span>
                <strong>{formatDate(credential.issuedOn)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
