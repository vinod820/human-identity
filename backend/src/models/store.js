const now = () => new Date().toISOString();

const store = {
  users: [],
  identities: [],
  fraudLogs: [],
  votes: [],
  otps: [],
  elections: [
    {
      _id: "e1",
      title: "CivicProof Student Council Demo",
      description: "Hackathon election showcasing private one-person-one-vote.",
      candidates: [
        { id: "c1", name: "Asha Raman", party: "Transparency First" },
        { id: "c2", name: "Kabir Jain", party: "Open Civic Alliance" },
        { id: "c3", name: "Mina Paul", party: "Digital Rights Front" }
      ],
      startTime: now(),
      endTime: new Date(Date.now() + 86400000).toISOString(),
      isActive: true
    }
  ]
};

module.exports = { store };
