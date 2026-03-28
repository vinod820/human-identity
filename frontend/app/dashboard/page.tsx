"use client";

import { useEffect, useState } from "react";
import { FraudStats } from "@/components/FraudStats";
import { getFraudLogs, getFraudStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    getFraudStats().then(setStats);
    getFraudLogs().then(setLogs);
  }, []);

  return (
    <>
      <section className="panel">
        <h1>Fraud Dashboard</h1>
        <p>Judge-facing integrity metrics showing registrations, duplicate blocks, suspicious attempts, and vote integrity.</p>
      </section>
      <FraudStats stats={stats} />
      <section className="panel">
        <h2>Recent Fraud Logs</h2>
        <div className="list">
          {logs.length ? logs.map((log, index) => (
            <div key={`${log._id as string}-${index}`} className="code">{JSON.stringify(log, null, 2)}</div>
          )) : <p>No fraud events recorded yet.</p>}
        </div>
      </section>
    </>
  );
}
