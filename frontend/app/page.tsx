import Link from "next/link";

const features = [
  "Face scan plus liveness to prove human presence",
  "OTP-backed phone uniqueness without exposing the raw number",
  "DID and identity commitments for private eligibility proof",
  "Nullifier-based vote flow to prevent duplicate voting",
  "Fraud dashboard with duplicate and suspicious activity visibility",
  "Polygon Amoy-ready contract calls for judge-friendly auditability"
];

const steps = [
  "Scan face and complete the blink and head-turn liveness prompts.",
  "Verify the phone via OTP and turn it into a privacy-safe hash.",
  "Generate a DID and identity commitment, then check for duplicates.",
  "Register the commitment on-chain and receive an auditable reference.",
  "Cast a single anonymous vote using a per-election nullifier.",
  "Open the dashboard to show blocked duplicates and voting integrity."
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="badges">
          <span className="badge">Privacy-preserving proof-of-humanity</span>
          <span className="badge">Hackathon MVP with finalist polish</span>
        </div>
        <h1>CivicProof X</h1>
        <p className="lead">
          A judge-ready system for proving a person is real, unique, and eligible to vote once without putting raw biometrics or phone data on-chain.
        </p>
        <div className="actions">
          <Link href="/register" className="button primary">Register Identity</Link>
          <Link href="/vote" className="button secondary">Vote Now</Link>
          <Link href="/dashboard" className="button secondary">Open Dashboard</Link>
        </div>
      </section>

      <section className="panel metrics">
        {features.map((feature) => (
          <article key={feature} className="stat-card">
            <h3>{feature}</h3>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Demo Flow</h2>
        <div className="timeline">
          {steps.map((step, index) => (
            <article key={step}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
