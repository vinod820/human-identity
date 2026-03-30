"use client";

import { FormEvent, useState } from "react";

export function OtpForm({
  onSend,
  onVerify
}: {
  onSend: (phone: string) => Promise<void>;
  onVerify: (phone: string, otp: string) => Promise<void>;
}) {
  const [phone, setPhone] = useState("9876543210");
  const [otp, setOtp] = useState("");

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    await onSend(phone);
  };

  return (
    <form onSubmit={handleSend}>
      <label>
        Phone Number
        <input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <div className="inline-actions">
        <button className="primary" type="submit">Send OTP</button>
      </div>
      <label>
        Enter OTP
        <input value={otp} onChange={(event) => setOtp(event.target.value)} />
      </label>
      <button className="secondary" type="button" onClick={() => onVerify(phone, otp)}>Verify OTP</button>
    </form>
  );
}
