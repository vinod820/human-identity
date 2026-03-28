const { sha256Hex } = require("./crypto");

function createNullifier(did, electionId, secret) {
  return sha256Hex(`${did}:${electionId}:${secret}`);
}

module.exports = { createNullifier };
