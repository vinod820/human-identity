const { nullifierSecret } = require("../config/env");
const { store } = require("../models/store");
const { createNullifier } = require("../utils/nullifier");

function generateProof(did, electionId) {
  const identity = store.identities.find((item) => item.did === did);
  if (!identity) {
    const error = new Error("Identity not found");
    error.status = 404;
    throw error;
  }

  const nullifierHash = createNullifier(did, electionId, nullifierSecret);

  return {
    nullifierHash,
    proof: `demo-proof:${did}:${electionId}`,
    zkReady: true
  };
}

function verifyProof({ did, electionId, nullifierHash, proof }) {
  const expectedNullifier = createNullifier(did, electionId, nullifierSecret);
  const isValid =
    proof === `demo-proof:${did}:${electionId}` &&
    expectedNullifier === nullifierHash &&
    !store.votes.some((vote) => vote.nullifierHash === nullifierHash);

  return { isValid };
}

module.exports = { generateProof, verifyProof };
