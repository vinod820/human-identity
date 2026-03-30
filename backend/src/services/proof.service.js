const { nullifierSecret } = require("../config/env");
const { store } = require("../models/store");
const { createNullifier } = require("../utils/nullifier");

function generateVotingToken(did, electionId) {
  return createNullifier(did, electionId, nullifierSecret);
}

function assignVotingTokens(identity) {
  const activeElections = store.elections.filter((item) => item.isActive);
  const tokens = activeElections.map((election) => ({
    electionId: election._id,
    token: generateVotingToken(identity.did, election._id),
    consumed: false
  }));
  identity.votingTokens = tokens;
  return tokens;
}

function resolveIdentityByToken(votingToken, electionId) {
  return store.identities.find((identity) =>
    (identity.votingTokens || []).some(
      (token) => token.electionId === electionId && token.token === votingToken
    )
  );
}

function generateProof(votingToken, electionId) {
  const identity = resolveIdentityByToken(votingToken, electionId);
  if (!identity) {
    const error = new Error("Voting token is not linked to an eligible identity");
    error.status = 404;
    throw error;
  }

  return {
    nullifierHash: votingToken,
    proof: `demo-proof:${votingToken}:${electionId}`,
    zkReady: true
  };
}

function verifyProof({ electionId, nullifierHash, proof }) {
  const identity = resolveIdentityByToken(nullifierHash, electionId);
  const matchingToken = identity?.votingTokens?.find(
    (token) => token.electionId === electionId && token.token === nullifierHash
  );
  const isValid =
    proof === `demo-proof:${nullifierHash}:${electionId}` &&
    Boolean(matchingToken) &&
    !matchingToken.consumed &&
    !store.votes.some((vote) => vote.nullifierHash === nullifierHash);

  return { isValid, identity };
}

function markVotingTokenConsumed(identityId, electionId, votingToken) {
  const identity = store.identities.find((item) => item._id === identityId);
  if (!identity) {
    return false;
  }

  const token = (identity.votingTokens || []).find(
    (item) => item.electionId === electionId && item.token === votingToken
  );
  if (!token) {
    return false;
  }

  token.consumed = true;
  token.consumedAt = new Date().toISOString();
  return true;
}

module.exports = {
  generateVotingToken,
  assignVotingTokens,
  resolveIdentityByToken,
  generateProof,
  verifyProof,
  markVotingTokenConsumed
};
