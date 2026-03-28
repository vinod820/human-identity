export function FraudStats({ stats }: { stats: Record<string, number> }) {
  return (
    <section className="metrics">
      {Object.entries(stats).map(([key, value]) => (
        <article className="stat-card" key={key}>
          <small>{key}</small>
          <h2>{value}</h2>
        </article>
      ))}
    </section>
  );
}
