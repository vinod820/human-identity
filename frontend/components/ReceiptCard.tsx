export function ReceiptCard({
  txHash,
  receiptHash,
  nullifierHash,
  timestamp
}: {
  txHash: string;
  receiptHash: string;
  nullifierHash: string;
  timestamp: string;
}) {
  return (
    <section className="panel">
      <h1>Vote Receipt</h1>
      <p className="status-ok">Vote recorded successfully.</p>
      <div className="list">
        <div>
          <small>Timestamp</small>
          <div className="code">{timestamp || "Pending"}</div>
        </div>
        <div>
          <small>Transaction Hash</small>
          <div className="code">{txHash || "Pending"}</div>
        </div>
        <div>
          <small>Receipt Hash</small>
          <div className="code">{receiptHash || "Pending"}</div>
        </div>
        <div>
          <small>Nullifier</small>
          <div className="code">{nullifierHash || "Pending"}</div>
        </div>
      </div>
    </section>
  );
}
