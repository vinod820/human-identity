"use client";

export function LivenessCheck({ onPass }: { onPass: () => void }) {
  return (
    <div className="step-card">
      <h3>Liveness Sequence</h3>
      <p>Blink once, turn left, then turn right. For the MVP scaffold this step is mocked but the API expects the same success payload the real detector would send.</p>
      <button className="primary" type="button" onClick={onPass}>Mark Liveness Passed</button>
    </div>
  );
}
