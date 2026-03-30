export function JourneyRail({
  activeStep,
  completedSteps = []
}: {
  activeStep: number;
  completedSteps?: number[];
}) {
  const completed = new Set(completedSteps);
  const labels = ["Camera", "Liveness", "Hash", "OTP", "DID", "Wallet", "Finish"];

  return (
    <div className="progress-steps">
      {labels.map((label, index) => {
        const step = index + 1;
        const isCurrent = step === activeStep;
        const isCompleted = completed.has(step);

        return (
          <div
            key={step}
            className={`progress-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`.trim()}
          >
            <div className="step-number">{step}</div>
            <div className="step-caption">{label}</div>
          </div>
        );
      })}
    </div>
  );
}
