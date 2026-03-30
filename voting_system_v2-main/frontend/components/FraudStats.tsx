import { formatMetricKey } from "@/lib/format";

export function FraudStats({ stats }: { stats: Record<string, number> }) {
  return (
    <section className="overview-grid reveal">
      {Object.entries(stats).map(([key, value]) => (
        <article className="card" key={key}>
          <small className="meta-label">{formatMetricKey(key)}</small>
          <div className="metric-value">{value}</div>
        </article>
      ))}
    </section>
  );
}
