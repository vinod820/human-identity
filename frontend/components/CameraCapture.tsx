"use client";

import { useState } from "react";

const fakeDescriptor = Array.from({ length: 8 }, (_, index) => Number((Math.sin(index + 1) * 0.5).toFixed(4)));

export function CameraCapture({ onCapture }: { onCapture: (descriptor: number[]) => void }) {
  const [captured, setCaptured] = useState(false);

  return (
    <div className="camera-box">
      <div className="list" style={{ width: "100%" }}>
        <strong>Camera Preview</strong>
        <p>Webcam integration is represented as a demo capture area so the flow is testable before wiring face-api.js or MediaPipe.</p>
        <button
          className="primary"
          type="button"
          onClick={() => {
            setCaptured(true);
            onCapture(fakeDescriptor);
          }}
        >
          {captured ? "Re-capture Face Descriptor" : "Capture Face Descriptor"}
        </button>
      </div>
    </div>
  );
}
