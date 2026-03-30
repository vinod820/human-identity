"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { JourneyRail } from "@/components/JourneyRail";
import {
  checkDuplicate,
  createDid,
  registerIdentity,
  sendOtp,
  verifyFace,
  verifyOtp
} from "@/lib/api";
import { loadStoredAuthSession } from "@/lib/auth-client";
import { buildIdentityTx } from "@/lib/web3";
import { clearState, saveState } from "@/lib/storage";
import {
  getCredentialTemplate,
  loadWalletVault,
  saveWalletVault,
  upsertWalletCredential
} from "@/lib/wallet-vault";
import { compactHash } from "@/lib/format";

type FaceLivenessPayload = {
  blinkPassed: boolean;
  leftTurnPassed: boolean;
  rightTurnPassed: boolean;
  turnPassed: boolean;
  yaw: number;
  eyeAspectRatio: number;
  blinkScore: number;
};

function initialPhone() {
  return "9876543210";
}

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[]>([]);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [faceHash, setFaceHash] = useState("");
  const [biometricCommitment, setBiometricCommitment] = useState("");
  const [phone, setPhone] = useState(initialPhone());
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneHash, setPhoneHash] = useState("");
  const [did, setDid] = useState("");
  const [identityCommitment, setIdentityCommitment] = useState("");
  const [walletReady, setWalletReady] = useState(false);
  const [credentialsLinked, setCredentialsLinked] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [voterCredential, setVoterCredential] = useState("");
  const [aadhaarCredential, setAadhaarCredential] = useState("");
  const [drivingCredential, setDrivingCredential] = useState("");
  const [healthCredential, setHealthCredential] = useState("");
  const [walletVaultId, setWalletVaultId] = useState("");
  const [hasAccountSession, setHasAccountSession] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"warning" | "success" | "danger">("warning");
  const [busyAction, setBusyAction] = useState("");
  const [captureAttempt, setCaptureAttempt] = useState(0);

  useEffect(() => {
    const session = loadStoredAuthSession();
    const profile = session?.account
      ? {
          fullName: session.account.fullName,
          email: session.account.email,
          phone: session.account.phone
        }
      : undefined;
    const vault = loadWalletVault(profile);
    const voter = vault.credentials.find((credential) => credential.kind === "voter");
    const aadhaar = vault.credentials.find((credential) => credential.kind === "aadhaar");
    const driving = vault.credentials.find((credential) => credential.kind === "driving");
    const health = vault.credentials.find((credential) => credential.kind === "health");

    setHasAccountSession(Boolean(session));
    setHolderName(vault.holderName);
    setPhone((current) => {
      const digits = profile?.phone?.replace(/\D/g, "").slice(-10);
      return digits || current;
    });
    setVoterCredential(voter?.number || "");
    setAadhaarCredential(aadhaar?.number || "");
    setDrivingCredential(driving?.number || "");
    setHealthCredential(health?.number || "");
    setWalletVaultId(vault.walletId);
  }, []);

  const activeStep = useMemo(() => {
    if (!started) {
      return 0;
    }

    if (!faceDescriptor.length) {
      return 1;
    }

    if (!livenessPassed) {
      return 2;
    }

    if (!faceHash) {
      return 3;
    }

    if (!otpSent) {
      return 4;
    }

    if (!did) {
      return 5;
    }

    if (!walletReady) {
      return 6;
    }

    return 7;
  }, [did, faceDescriptor.length, faceHash, livenessPassed, otpSent, started, walletReady]);

  const completedSteps = useMemo(() => {
    const next: number[] = [];

    if (faceDescriptor.length) {
      next.push(1);
    }

    if (livenessPassed) {
      next.push(2);
    }

    if (faceHash) {
      next.push(3);
    }

    if (otpSent) {
      next.push(4);
    }

    if (did) {
      next.push(5);
    }

    if (walletReady) {
      next.push(6);
    }

    if (credentialsLinked) {
      next.push(7);
    }

    return next;
  }, [credentialsLinked, did, faceDescriptor.length, faceHash, livenessPassed, otpSent, walletReady]);

  const stage = useMemo(() => {
    if (!started) {
      return "intro";
    }

    if (!faceHash) {
      return "capture";
    }

    if (!did) {
      return "otp";
    }

    if (!walletReady) {
      return "wallet";
    }

    if (!credentialsLinked) {
      return "credentials";
    }

    return "complete";
  }, [credentialsLinked, did, faceHash, started, walletReady]);

  const stageTitle = useMemo(() => {
    switch (stage) {
      case "capture":
        return "Face Capture";
      case "otp":
        return "Phone Verification";
      case "wallet":
        return "Wallet Registration";
      case "credentials":
        return "Credential Linking";
      case "complete":
        return "Identification Complete";
      default:
        return "Secure Identity Platform";
    }
  }, [stage]);

  useEffect(() => {
    if (!started) {
      return;
    }

    setStatus("");
    setStatusTone("warning");
  }, [stage, started]);

  function resetFlow(nextStarted = false) {
    clearState();
    setStarted(nextStarted);
    setFaceDescriptor([]);
    setLivenessPassed(false);
    setFaceHash("");
    setBiometricCommitment("");
    setPhone(initialPhone());
    setOtp("");
    setGeneratedOtp("");
    setOtpSent(false);
    setPhoneHash("");
    setDid("");
    setIdentityCommitment("");
    setWalletReady(false);
    setCredentialsLinked(false);
    setWalletVaultId("");
    setStatus("");
    setStatusTone("warning");
    setBusyAction("");
    setCaptureAttempt((current) => current + 1);
  }

  async function handleFaceVerify(nextDescriptor: number[], livenessData: FaceLivenessPayload) {
    setBusyAction("face");
    setStatus("");
    setFaceDescriptor(nextDescriptor);
    setLivenessPassed(livenessData.blinkPassed && livenessData.turnPassed);

    try {
      const data = await verifyFace(nextDescriptor, livenessData);

      if (!data.success) {
        setStatusTone("danger");
        setStatus("Face failed");
        setFaceDescriptor([]);
        setLivenessPassed(false);
        setCaptureAttempt((current) => current + 1);
        return;
      }

      setFaceHash(data.faceHash);
      setBiometricCommitment(data.biometricCommitment);
      saveState({
        faceDescriptor: nextDescriptor,
        faceHash: data.faceHash,
        biometricCommitment: data.biometricCommitment
      });
    } catch (error) {
      setStatusTone("danger");
      setStatus(error instanceof Error ? error.message : "Face failed");
      setFaceDescriptor([]);
      setLivenessPassed(false);
      setCaptureAttempt((current) => current + 1);
    } finally {
      setBusyAction("");
    }
  }

  async function handleSendOtp() {
    setBusyAction("send-otp");
    setStatus("");

    try {
      const data = await sendOtp(phone);
      setGeneratedOtp(data.otpPreview);
      setOtp(data.otpPreview);
      setOtpSent(true);
    } catch (error) {
      setStatusTone("danger");
      setStatus(error instanceof Error ? error.message : "OTP failed");
    } finally {
      setBusyAction("");
    }
  }

  async function handleVerifyOtp() {
    if (!faceHash || !biometricCommitment) {
      setStatusTone("danger");
      setStatus("Face first");
      return;
    }

    setBusyAction("verify-otp");
    setStatus("");

    try {
      const verified = await verifyOtp(phone, otp || generatedOtp);
      const duplicate = await checkDuplicate({
        faceHash,
        phoneHash: verified.phoneHash,
        faceDescriptor
      });

      if (duplicate.existingIdentity) {
        setPhoneHash(verified.phoneHash);
        setDid(duplicate.existingIdentity.did);
        setIdentityCommitment(duplicate.existingIdentity.identityCommitment);
        saveState({
          phoneHash: verified.phoneHash,
          did: duplicate.existingIdentity.did,
          identityCommitment: duplicate.existingIdentity.identityCommitment
        });
        setStatusTone("success");
        setStatus("");
        return;
      }

      if (!duplicate.allowed) {
        setStatusTone("danger");
        if (duplicate.duplicatePhone) {
          setStatus("Phone already linked");
        } else if (duplicate.duplicateFace || duplicate.similarFace?.matched) {
          setStatus("Face already linked");
        } else {
          setStatus("Duplicate blocked");
        }
        return;
      }

      const didResponse = await createDid(faceHash, verified.phoneHash);
      await registerIdentity({
        did: didResponse.did,
        faceHash,
        phoneHash: verified.phoneHash,
        identityCommitment: didResponse.identityCommitment,
        biometricCommitment,
        faceDescriptor
      });

      setPhoneHash(verified.phoneHash);
      setDid(didResponse.did);
      setIdentityCommitment(didResponse.identityCommitment);
      saveState({
        phoneHash: verified.phoneHash,
        did: didResponse.did,
        identityCommitment: didResponse.identityCommitment
      });
    } catch (error) {
      setStatusTone("danger");
      setStatus(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setBusyAction("");
    }
  }

  async function handleWalletRegister() {
    if (!identityCommitment) {
      return;
    }

    setBusyAction("wallet");
    setStatus("");

    try {
      await buildIdentityTx(identityCommitment);
      setWalletReady(true);
    } catch (error) {
      setStatusTone("danger");
      setStatus(error instanceof Error ? error.message : "Wallet failed");
    } finally {
      setBusyAction("");
    }
  }

  async function handleCredentialLink() {
    if (!did) {
      return;
    }

    const name = holderName.trim();

    if (!name) {
      setStatusTone("danger");
      setStatus("Name required");
      return;
    }

    if (!voterCredential.trim() && !aadhaarCredential.trim() && !drivingCredential.trim() && !healthCredential.trim()) {
      setStatusTone("danger");
      setStatus("Add credentials");
      return;
    }

    setBusyAction("credentials");
    setStatus("");

    try {
      const session = loadStoredAuthSession();
      const profile = session?.account
        ? {
            fullName: session.account.fullName,
            email: session.account.email,
            phone: session.account.phone
          }
        : undefined;
      let nextVault = {
        ...loadWalletVault(profile),
        holderName: name,
        phone: profile?.phone || phone,
        did,
        phoneHash,
        faceHash,
        identityCommitment,
        updatedAt: new Date().toISOString()
      };

      const credentialUpdates = [
        { kind: "voter" as const, number: voterCredential.trim() },
        { kind: "aadhaar" as const, number: aadhaarCredential.trim() },
        { kind: "driving" as const, number: drivingCredential.trim() },
        { kind: "health" as const, number: healthCredential.trim() }
      ];

      credentialUpdates.forEach(({ kind, number }) => {
        const current = nextVault.credentials.find((credential) => credential.kind === kind) || getCredentialTemplate(kind);
        const resolvedNumber = number || current.number;
        nextVault = upsertWalletCredential(nextVault, {
          ...current,
          number: resolvedNumber,
          linked: Boolean(resolvedNumber),
          status: resolvedNumber ? "verified" : "review"
        });
      });

      saveWalletVault(nextVault);
      setWalletVaultId(nextVault.walletId);
      setCredentialsLinked(true);
      setStatusTone("success");
      setStatus("");
    } catch (error) {
      setStatusTone("danger");
      setStatus(error instanceof Error ? error.message : "Wallet sync failed");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <div className="voting-container reveal">
      {!started ? (
        <section className="start-hero">
          <div className="start-hero-glow start-hero-glow-left" aria-hidden="true" />
          <div className="start-hero-glow start-hero-glow-right" aria-hidden="true" />
          <div className="start-hero-decor" aria-hidden="true">
            <span className="start-shape shape-square shape-cyan" />
            <span className="start-shape shape-diamond shape-orange" />
            <span className="start-shape shape-hex shape-red" />
            <span className="start-shape shape-triangle shape-blue" />
            <span className="start-shape shape-square shape-green" />
            <span className="start-shape shape-diamond shape-cyan" />
          </div>
          <div className="start-hero-kicker">CivicProof X</div>
          <h1 className="start-hero-title">Secure Identity Platform</h1>
          <div className="start-hero-card">
            <button className="btn btn-large" type="button" onClick={() => resetFlow(true)}>
              Start
            </button>
          </div>
        </section>
      ) : null}

      {started ? (
        <>
          <section className="flow-page-head">
            <div className="flow-page-kicker">CivicProof X</div>
            <h1 className="flow-page-title">{stageTitle}</h1>
          </section>

          <section className="verification-progress">
            <JourneyRail activeStep={activeStep || 1} completedSteps={completedSteps} />
          </section>

          {stage === "capture" ? (
            <section className="verification-card verification-card-wide flow-shell">
              <div className="camera-layout">
                <CameraCapture
                  key={captureAttempt}
                  busy={busyAction === "face"}
                  onComplete={(payload) => void handleFaceVerify(payload.descriptor, payload.livenessData)}
                />
              </div>

              {statusTone === "danger" && status ? (
                <div className={`message-panel ${statusTone}`}>
                  <strong>{status}</strong>
                </div>
              ) : null}
            </section>
          ) : null}

          {stage === "otp" ? (
            <section className="verification-card flow-shell">
              <div className="flow-form-grid">
                <input
                  className="verification-input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Phone"
                  inputMode="numeric"
                />
                <input
                  className="verification-input"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="OTP"
                  inputMode="numeric"
                />
              </div>

              {statusTone === "danger" && status ? (
                <div className={`message-panel ${statusTone}`}>
                  <strong>{status}</strong>
                </div>
              ) : null}

              <div className="button-group center">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={phone.length !== 10 || busyAction === "send-otp"}
                  onClick={() => void handleSendOtp()}
                >
                  {busyAction === "send-otp" ? "Sending..." : "Send"}
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={!otpSent || (otp.length !== 6 && !generatedOtp) || busyAction === "verify-otp"}
                  onClick={() => void handleVerifyOtp()}
                >
                  {busyAction === "verify-otp" ? "Checking..." : "Verify"}
                </button>
              </div>
            </section>
          ) : null}

          {stage === "wallet" ? (
            <section className="verification-card flow-shell">
              {statusTone === "danger" && status ? (
                <div className={`message-panel ${statusTone}`}>
                  <strong>{status}</strong>
                </div>
              ) : null}

              <div className="button-group center">
                <button
                  className="btn btn-large"
                  type="button"
                  disabled={!did || busyAction === "wallet"}
                  onClick={() => void handleWalletRegister()}
                >
                  {busyAction === "wallet" ? "Registering..." : "Register"}
                </button>
              </div>
            </section>
          ) : null}

          {stage === "credentials" ? (
            <section className="verification-card verification-card-wide flow-shell">
              <div className="vault-input-grid">
                <label className="vault-field vault-field-wide">
                  <span>Name</span>
                  <input className="vault-input" value={holderName} onChange={(event) => setHolderName(event.target.value)} />
                </label>
                <label className="vault-field">
                  <span>Voter ID</span>
                  <input
                    className="vault-input"
                    value={voterCredential}
                    onChange={(event) => setVoterCredential(event.target.value)}
                  />
                </label>
                <label className="vault-field">
                  <span>Aadhaar</span>
                  <input
                    className="vault-input"
                    value={aadhaarCredential}
                    onChange={(event) => setAadhaarCredential(event.target.value)}
                  />
                </label>
                <label className="vault-field">
                  <span>Driving License</span>
                  <input
                    className="vault-input"
                    value={drivingCredential}
                    onChange={(event) => setDrivingCredential(event.target.value)}
                  />
                </label>
                <label className="vault-field">
                  <span>Health ID</span>
                  <input
                    className="vault-input"
                    value={healthCredential}
                    onChange={(event) => setHealthCredential(event.target.value)}
                  />
                </label>
              </div>

              {status ? (
                <div className={`message-panel ${statusTone}`}>
                  <strong>{status}</strong>
                </div>
              ) : null}

              <div className="button-group center">
                <button
                  className="btn btn-large"
                  type="button"
                  disabled={busyAction === "credentials"}
                  onClick={() => void handleCredentialLink()}
                >
                  {busyAction === "credentials" ? "Saving..." : "Save To Wallet"}
                </button>
              </div>
            </section>
          ) : null}

          {stage === "complete" ? (
            <section className="verification-card verification-card-wide flow-shell receipt-stage">
              <div className="token-grid">
                <div className="token-pill">{compactHash(did)}</div>
                <div className="token-pill">{compactHash(faceHash)}</div>
                <div className="token-pill">{compactHash(phoneHash)}</div>
                <div className="token-pill">{walletVaultId || "Wallet"}</div>
              </div>

              <div className="button-group center">
                <Link className="btn" href={hasAccountSession ? "/wallet" : "/auth"}>
                  {hasAccountSession ? "Open Wallet" : "Sign In"}
                </Link>
                <Link className="secondary-button" href="/voting">
                  Go To Voting
                </Link>
                <button className="secondary-button" type="button" onClick={() => resetFlow(false)}>
                  Restart
                </button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
