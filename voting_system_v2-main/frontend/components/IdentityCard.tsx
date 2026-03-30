import { compactHash } from "@/lib/format";

export function IdentityCard({
  did,
  faceHash,
  phoneHash,
  identityCommitment
}: {
  did: string;
  faceHash: string;
  phoneHash: string;
  identityCommitment: string;
}) {
  return (
    <section className="verification-card verification-card-wide reveal">
      <h2>Identity Wallet</h2>
      <p>Review the commitment bundle before chain registration.</p>

      <div className="overview-grid">
        <article className="stat-card">
          <div className="stat-value">{did ? "1" : "0"}</div>
          <div className="stat-label">DID</div>
        </article>
        <article className="stat-card">
          <div className="stat-value">{faceHash ? "1" : "0"}</div>
          <div className="stat-label">Face Hash</div>
        </article>
        <article className="stat-card">
          <div className="stat-value">{phoneHash ? "1" : "0"}</div>
          <div className="stat-label">Phone Hash</div>
        </article>
      </div>

      <div className="review-section">
        <div className="review-grid">
          <div className="review-item">
            <small className="meta-label">DID</small>
            <div className="code">{did || "Pending"}</div>
          </div>
          <div className="review-item">
            <small className="meta-label">Face Hash</small>
            <div className="code">{faceHash || "Pending"}</div>
          </div>
          <div className="review-item">
            <small className="meta-label">Phone Hash</small>
            <div className="code">{phoneHash || "Pending"}</div>
          </div>
          <div className="review-item">
            <small className="meta-label">Commitment</small>
            <div className="code">{identityCommitment ? compactHash(identityCommitment) : "Pending"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
