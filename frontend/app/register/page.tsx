"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CameraCapture } from "@/components/CameraCapture";
import { LivenessCheck } from "@/components/LivenessCheck";
import { saveState } from "@/lib/storage";
import { verifyFace } from "@/lib/api";

export default function RegisterPage() {
  const [faceDescriptor, setFaceDescriptor] = useState<number[]>([]);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [result, setResult] = useState<{ faceHash: string; biometricCommitment: string } | null>(null);
  const ready = useMemo(() => faceDescriptor.length > 0 && livenessPassed, [faceDescriptor, livenessPassed]);

  return (
    <section className="panel">
      <h1>Register Identity</h1>
      <p>Start with a face scan and a lightweight liveness challenge. The real camera pipeline can plug into this page without changing the backend contract.</p>
      <div className="card-grid">
        <CameraCapture onCapture={setFaceDescriptor} />
        <LivenessCheck onPass={() => setLivenessPassed(true)} />
      </div>
      <div className="list" style={{ marginTop: "1rem" }}>
        <div className={faceDescriptor.length ? "status-ok" : "status-warn"}>Face descriptor: {faceDescriptor.length ? "Captured" : "Waiting"}</div>
        <div className={livenessPassed ? "status-ok" : "status-warn"}>Liveness: {livenessPassed ? "Passed" : "Waiting"}</div>
      </div>
      <div className="inline-actions" style={{ marginTop: "1rem" }}>
        <button
          className="primary"
          type="button"
          disabled={!ready}
          onClick={async () => {
            const data = await verifyFace(faceDescriptor, { blinkPassed: true, turnPassed: true });
            setResult(data);
            saveState({ faceDescriptor, faceHash: data.faceHash, biometricCommitment: data.biometricCommitment });
          }}
        >
          Generate Face Hash
        </button>
        <Link href="/verify-phone" className="button secondary">Continue to Phone Verification</Link>
      </div>
      {result ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <div><strong className="status-ok">Human Verified</strong></div>
          <div className="code">{result.faceHash}</div>
        </div>
      ) : null}
    </section>
  );
}
