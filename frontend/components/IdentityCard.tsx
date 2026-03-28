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
    <section className="panel">
      <h1>Identity Wallet</h1>
      <div className="list">
        <div><strong className="status-ok">Human Verified</strong></div>
        <div><strong className="status-ok">Phone Verified</strong></div>
        <div><strong className="status-ok">Unique Identity</strong></div>
        <div>
          <small>DID</small>
          <div className="code">{did || "Generate via /verify-phone"}</div>
        </div>
        <div>
          <small>Face Hash</small>
          <div className="code">{faceHash || "Pending"}</div>
        </div>
        <div>
          <small>Phone Hash</small>
          <div className="code">{phoneHash || "Pending"}</div>
        </div>
        <div>
          <small>Identity Commitment</small>
          <div className="code">{identityCommitment || "Pending"}</div>
        </div>
      </div>
    </section>
  );
}
