"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  hydrateStoredAuthSession,
  loadLastUsedEmail,
  loginAndStore,
  recoverAndStore,
  signupAndStore
} from "@/lib/auth-client";

type Mode = "signin" | "signup" | "recover";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(loadLastUsedEmail());

    void hydrateStoredAuthSession().then((session) => {
      if (session?.token) {
        router.replace("/wallet");
      }
    });
  }, [router]);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return false;
    }

    if (mode === "signup") {
      return Boolean(fullName.trim() && phone.trim() && password.length >= 8 && password === confirmPassword);
    }

    if (mode === "recover") {
      return Boolean(phone.trim() && password.length >= 8 && password === confirmPassword);
    }

    return true;
  }, [confirmPassword, email, fullName, mode, password]);

  async function handleSubmit() {
    setBusy(true);
    setError("");

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await signupAndStore({
          fullName,
          email,
          password,
          phone
        });
      } else if (mode === "recover") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await recoverAndStore({
          fullName,
          email,
          phone,
          password
        });
      } else {
        await loginAndStore({
          email,
          password
        });
      }

      router.push("/wallet");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page reveal">
      <section className="auth-shell">
        <article className="auth-brand-panel">
          <div className="wallet-kicker">CivicProof Account</div>
          <h1>
            {mode === "signup"
              ? "Create account"
              : mode === "recover"
                ? "Recover access"
                : "Sign in"}
          </h1>
          <p className="auth-copy">
            Account access keeps your wallet, credentials, and secure pass data attached to a real profile.
          </p>
          <div className="auth-chip-row">
            <span className="wallet-meta-pill">Persistent account</span>
            <span className="wallet-meta-pill">Session restore</span>
            <span className="wallet-meta-pill">Wallet sync</span>
          </div>
          <div className="auth-link-row">
            <Link className="secondary-button" href="/">
              Home
            </Link>
            <Link className="secondary-button" href="/wallet">
              Wallet
            </Link>
          </div>
        </article>

        <article className="auth-form-panel">
          <div className="auth-toggle">
            <button
              className={`auth-toggle-button ${mode === "signin" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`auth-toggle-button ${mode === "signup" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
            <button
              className={`auth-toggle-button ${mode === "recover" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("recover")}
            >
              Recover
            </button>
          </div>

          <div className="auth-form-grid">
            {mode !== "signin" ? (
              <label className="vault-field vault-field-wide">
                <span>{mode === "recover" ? "Full Name Optional" : "Full Name"}</span>
                <input className="vault-input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
            ) : null}

            <label className="vault-field vault-field-wide">
              <span>Email</span>
              <input
                className="vault-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {mode !== "signin" ? (
              <label className="vault-field vault-field-wide">
                <span>Phone</span>
                <input className="vault-input" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
            ) : null}

            <label className="vault-field vault-field-wide">
              <span>Password</span>
              <input
                className="vault-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {mode !== "signin" ? (
              <label className="vault-field vault-field-wide">
                <span>Confirm Password</span>
                <input
                  className="vault-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            ) : null}
          </div>

          {error ? (
            <div className="message-panel danger">
              <strong>{error}</strong>
            </div>
          ) : null}

          <div className="auth-action-row">
            <button className="btn btn-large" type="button" disabled={!canSubmit || busy} onClick={() => void handleSubmit()}>
              {busy
                ? "Working..."
                : mode === "signup"
                  ? "Create Account"
                  : mode === "recover"
                    ? "Recover Account"
                    : "Sign In"}
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
