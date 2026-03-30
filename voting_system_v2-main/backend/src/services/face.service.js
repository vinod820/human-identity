const { store } = require("../models/store");
const { generateBiometricCommitment, generateFaceHash } = require("./hash.service");

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator ? dot / denominator : 0;
}

function verifyFace(faceDescriptor, livenessData = {}) {
  const singleFace = Array.isArray(faceDescriptor) && faceDescriptor.length > 0;
  const blinkPassed = Boolean(livenessData.blinkPassed);
  const turnPassed = Boolean(
    livenessData.turnPassed ?? (livenessData.leftTurnPassed && livenessData.rightTurnPassed)
  );
  const isHumanVerified = Boolean(singleFace && blinkPassed && turnPassed);
  const faceHash = generateFaceHash(faceDescriptor);

  return {
    success: isHumanVerified,
    faceHash,
    biometricCommitment: generateBiometricCommitment(faceHash),
    isHumanVerified
  };
}

function findSimilarFace(faceDescriptor, threshold = 0.85) {
  let bestMatch = null;

  store.identities.forEach((identity) => {
    if (!identity.faceDescriptor?.length) {
      return;
    }

    const score = cosineSimilarity(faceDescriptor, identity.faceDescriptor);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        userId: identity.userId,
        did: identity.did,
        score
      };
    }
  });

  if (bestMatch && bestMatch.score >= threshold) {
    return { matched: true, ...bestMatch };
  }

  return { matched: false, score: bestMatch?.score || 0 };
}

module.exports = { verifyFace, findSimilarFace, cosineSimilarity };
