"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OtpForm } from "@/components/OtpForm";
import { checkDuplicate, registerIdentity, sendOtp, verifyOtp } from "@/lib/api";
import { loadState, saveState } from "@/lib/storage";

export default function VerifyPhonePage() {
  const [message, setMessage] = useState("Use the demo OTP preview from the backend response.");
  const [phoneHash, setPhoneHash] = useState("");
  const [did, setDid] = useState("");
  const [identityCommitment, setIdentityCommitment] = useState("");
  const [state, setState] = useState(loadState());

  useEffect(() => {
    setState(loadState());
  }, []);

  return (
    <section className="panel">
      <h1>Verify Phone</h1>
      <p>After OTP verification, the backend hashes the phone number, runs duplicate checks, and issues a custom DID for the identity wallet.</p>
      <OtpForm
        onSend={async (phone) => {
          const data = await sendOtp(phone);
          setMessage(`${data.message} Demo OTP: ${data.otpPreview}`);
        }}
        onVerify={async (phone, otp) => {
          const verified = await verifyOtp(phone, otp);
          const duplicate = await checkDuplicate({
            faceHash: state.faceHash,
            phoneHash: verified.phoneHash,
            faceDescriptor: state.faceDescriptor
          });

          if (!duplicate.allowed) {
            setMessage("Duplicate or suspicious identity detected. Registration blocked.");
            return;
          }

          const registration = await registerIdentity({
            faceHash: state.faceHash,
            phoneHash: verified.phoneHash,
            identityCommitment: "",
            biometricCommitment: state.biometricCommitment,
            faceDescriptor: state.faceDescriptor
          });

          saveState({
            phoneHash: verified.phoneHash,
            did: registration.did,
            identityCommitment: registration.identityCommitment,
            votingToken: registration.votingTokens?.[0]?.token || "",
            txHash: registration.blockchain?.txHash || ""
          });

          setPhoneHash(verified.phoneHash);
          setDid(registration.did);
          setIdentityCommitment(registration.identityCommitment);
          setMessage("Phone verified, DID issued, token generated, and identity registered.");
        }}
      />
      <p>{message}</p>
      {phoneHash ? <div className="code">{phoneHash}</div> : null}
      {did ? <div className="code">{did}</div> : null}
      {identityCommitment ? <div className="code">{identityCommitment}</div> : null}
      <div className="inline-actions">
        <Link href="/identity" className="button primary">Open Identity Wallet</Link>
      </div>
    </section>
  );
}
