import Link from "next/link";
import { compactHash, formatTimestamp } from "@/lib/format";

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
  const hasReceipt = Boolean(txHash || receiptHash || nullifierHash || timestamp);

  return (
    <section className="verification-card verification-card-wide reveal">
      <h2>Vote Receipt</h2>
      <p>{hasReceipt ? "Recorded on the audit trail." : "No receipt yet."}</p>

      <div className={hasReceipt ? "verification-hint" : "error-message"}>
        <strong>{hasReceipt ? "Receipt Ready" : "Receipt Pending"}</strong>
      </div>

      <div className="review-section">
        <div className="review-grid">
          <div className="review-item">
            <small className="meta-label">Timestamp</small>
            <div className="code">{formatTimestamp(timestamp)}</div>
          </div>
          <div className="review-item">
            <small className="meta-label">Transaction</small>
            <div className="code">{compactHash(txHash)}</div>
          </div>
          <div className="review-item">
            <small className="meta-label">Receipt Hash</small>
            <div className="code">{compactHash(receiptHash)}</div>
          </div>
          <div className="review-item">
            <small className="meta-label">Nullifier</small>
            <div className="code">{compactHash(nullifierHash)}</div>
          </div>
        </div>
      </div>

      <div className="button-group center">
        <Link href="/dashboard" className="secondary-button">Dashboard</Link>
        <Link href="/voting" className="btn">Back to Voting</Link>
      </div>
    </section>
  );
}
