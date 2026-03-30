const { v4: uuidv4 } = require("uuid");
const { createIdentityCommitment } = require("./hash.service");

function createDid() {
  return `did:civicproof:${uuidv4()}`;
}

function issueDid(faceHash, phoneHash) {
  const did = createDid();
  const identityCommitment = createIdentityCommitment(faceHash, phoneHash, did);
  return { did, identityCommitment };
}

module.exports = { createDid, issueDid };
