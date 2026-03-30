"use client";

import { useState } from "react";

const prompts = ["Blink", "Left", "Right"];

export function LivenessCheck({ onPass, passed }: { onPass: () => void; passed: boolean }) {
  const [completed, setCompleted] = useState<boolean[]>([false, false, false]);
  const allDone = completed.every(Boolean);

  return (
    <div className="surface-card stack-md">
      <div className="flow-mini-grid">
        {prompts.map((prompt, index) => (
          <button
            key={prompt}
            className={`liveness-step ${completed[index] ? "done" : ""}`}
            type="button"
            onClick={() => {
              setCompleted((current) => current.map((item, itemIndex) => itemIndex === index ? !item : item));
            }}
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      <button className="btn" type="button" disabled={!allDone || passed} onClick={onPass}>
        {passed ? "Done" : "Confirm"}
      </button>
    </div>
  );
}
