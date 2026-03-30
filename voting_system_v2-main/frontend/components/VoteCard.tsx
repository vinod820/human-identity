export type Candidate = {
  id: string;
  name: string;
  party: string;
};

export function VoteCard({
  title,
  description,
  electionWindow,
  candidates,
  selectedCandidate,
  submitting,
  canSubmit,
  onSelect,
  onSubmit
}: {
  title: string;
  description: string;
  electionWindow: string;
  candidates: Candidate[];
  selectedCandidate: string;
  submitting: boolean;
  canSubmit: boolean;
  onSelect: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="verification-card verification-card-wide reveal">
      <h2>{title}</h2>
      <p>{description}</p>
      <p>Election window: {electionWindow}</p>

      <div className="candidates-list">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className={`candidate-card ${selectedCandidate === candidate.id ? "selected" : ""}`}
            onClick={() => onSelect(candidate.id)}
          >
            <div className="candidate-symbol">{candidate.name.slice(0, 2).toUpperCase()}</div>
            <div className="candidate-name">{candidate.name}</div>
            <div className="candidate-party">{candidate.party}</div>
            <button className="vote-button" type="button">
              {selectedCandidate === candidate.id ? "Selected" : "Select Candidate"}
            </button>
          </article>
        ))}
      </div>

      <div className="button-group center">
        <button className="btn btn-large" type="button" onClick={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Submitting..." : "Submit Vote"}
        </button>
      </div>
    </section>
  );
}
