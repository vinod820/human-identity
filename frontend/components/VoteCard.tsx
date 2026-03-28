export type Candidate = {
  id: string;
  name: string;
  party: string;
};

export function VoteCard({
  title,
  candidates,
  selectedCandidate,
  onSelect,
  onSubmit
}: {
  title: string;
  candidates: Candidate[];
  selectedCandidate: string;
  onSelect: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="panel">
      <h1>{title}</h1>
      <p>Anonymous one-person-one-vote flow secured by a nullifier for this election.</p>
      <div className="card-grid">
        {candidates.map((candidate) => (
          <article key={candidate.id}>
            <h3>{candidate.name}</h3>
            <p>{candidate.party}</p>
            <button
              className={selectedCandidate === candidate.id ? "primary" : "secondary"}
              type="button"
              onClick={() => onSelect(candidate.id)}
            >
              {selectedCandidate === candidate.id ? "Selected" : "Choose Candidate"}
            </button>
          </article>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button className="primary" type="button" onClick={onSubmit} disabled={!selectedCandidate}>Submit Vote</button>
      </div>
    </section>
  );
}
