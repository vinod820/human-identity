import { Suspense } from "react";
import { WalletPassClient } from "@/components/WalletPassClient";

export default function WalletPassPage() {
  return (
    <div className="wallet-pass-shell reveal">
      <Suspense
        fallback={
          <section className="wallet-pass-card">
            <div className="wallet-pass-empty">
              <div className="wallet-kicker">Secure Pass</div>
              <h1>Decrypting</h1>
            </div>
          </section>
        }
      >
        <WalletPassClient />
      </Suspense>
    </div>
  );
}
