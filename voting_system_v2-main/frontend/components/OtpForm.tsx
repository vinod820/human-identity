"use client";

import { FormEvent, useState } from "react";

export function OtpForm({
  onSend,
  onVerify,
  demoOtp
}: {
  onSend: (phone: string) => Promise<void>;
  onVerify: (phone: string, otp: string) => Promise<void>;
  demoOtp?: string;
}) {
  const [phone, setPhone] = useState("9876543210");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);

    try {
      await onSend(phone);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="stack-md">
      {demoOtp ? (
        <div className="demo-info">
          <strong>Demo OTP {demoOtp}</strong>
        </div>
      ) : null}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            className="form-input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone"
          />
        </div>

        <div className="form-group">
          <label className="form-label">OTP</label>
          <input
            className="form-input"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="OTP"
          />
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
        {demoOtp ? (
          <button className="btn btn-small" type="button" onClick={() => setOtp(demoOtp)}>
            Use Demo
          </button>
        ) : null}
        <button
          className="btn"
          type="button"
          disabled={!otp || verifying}
          onClick={async () => {
            setVerifying(true);

            try {
              await onVerify(phone, otp);
            } finally {
              setVerifying(false);
            }
          }}
        >
          {verifying ? "Verifying..." : "Verify"}
        </button>
      </div>
    </form>
  );
}
