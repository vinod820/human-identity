"use client";

import { useEffect, useState } from "react";
import { ReceiptCard } from "@/components/ReceiptCard";
import { loadState } from "@/lib/storage";

export default function ReceiptPage() {
  const [state, setState] = useState(loadState());

  useEffect(() => {
    setState(loadState());
  }, []);

  return (
    <ReceiptCard
      txHash={state.txHash}
      receiptHash={state.receiptHash}
      nullifierHash={state.nullifierHash}
      timestamp={state.timestamp}
    />
  );
}
