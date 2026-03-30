const User = require("../models/User");
const Identity = require("../models/Identity");
const { store } = require("../models/store");
const { findSimilarFace, verifyFace } = require("../services/face.service");
const { logFraudEvent } = require("../services/fraud.service");
const { createDeviceHash } = require("../services/hash.service");
const { issueDid } = require("../services/did.service");
const { assignVotingTokens } = require("../services/proof.service");
const { registerIdentityOnChain } = require("../services/blockchain.service");
const { ensureFields } = require("../utils/validator");

function verifyFaceHandler(req, res, next) {
  try {
    ensureFields(req.body, ["faceDescriptor", "livenessData"]);
    res.json(verifyFace(req.body.faceDescriptor, req.body.livenessData));
  } catch (error) {
    next(error);
  }
}

function checkDuplicateHandler(req, res, next) {
  try {
    ensureFields(req.body, ["faceHash", "phoneHash"]);

    const duplicateFace = store.identities.some((identity) => identity.faceHash === req.body.faceHash);
    const duplicatePhone = store.identities.some((identity) => identity.phoneHash === req.body.phoneHash);
    const similarity = req.body.faceDescriptor?.length ? findSimilarFace(req.body.faceDescriptor) : { matched: false, score: 0 };

    if (duplicateFace) {
      logFraudEvent("duplicate_face", "unknown", { faceHash: req.body.faceHash }, 90);
    }

    if (duplicatePhone) {
      logFraudEvent("duplicate_phone", "unknown", { phoneHash: req.body.phoneHash }, 85);
    }

    if (similarity.matched) {
      logFraudEvent("suspicious_behavior", similarity.userId || "unknown", { similarity }, 70);
    }

    res.json({
      duplicateFace,
      duplicatePhone,
      similarFace: similarity,
      allowed: !(duplicateFace || duplicatePhone || similarity.matched)
    });
  } catch (error) {
    next(error);
  }
}

async function registerIdentityHandler(req, res, next) {
  try {
    ensureFields(req.body, ["faceHash", "phoneHash"]);

    const duplicateFace = store.identities.some((identity) => identity.faceHash === req.body.faceHash);
    const duplicatePhone = store.identities.some((identity) => identity.phoneHash === req.body.phoneHash);
    if (duplicateFace || duplicatePhone) {
      return res.status(409).json({
        success: false,
        message: "Duplicate identity detected, registration blocked"
      });
    }

    const didBundle =
      req.body.did && req.body.identityCommitment
        ? { did: req.body.did, identityCommitment: req.body.identityCommitment }
        : issueDid(req.body.faceHash, req.body.phoneHash);

    const user = new User({
      _id: `user_${store.users.length + 1}`,
      did: didBundle.did,
      walletAddress: req.body.walletAddress || "",
      phoneHash: req.body.phoneHash,
      faceHash: req.body.faceHash,
      identityCommitment: didBundle.identityCommitment,
      isPhoneVerified: true,
      isHumanVerified: true,
      isUnique: true,
      trustScore: 92,
      createdAt: new Date().toISOString()
    });

    const identity = new Identity({
      _id: `identity_${store.identities.length + 1}`,
      userId: user._id,
      did: didBundle.did,
      faceEmbeddingRef: "encrypted://demo-face-ref",
      faceDescriptor: req.body.faceDescriptor || [],
      faceHash: req.body.faceHash,
      phoneHash: req.body.phoneHash,
      deviceHash: createDeviceHash(req.body.deviceFingerprint),
      identityCommitment: didBundle.identityCommitment,
      biometricCommitment: req.body.biometricCommitment || "",
      status: "active",
      createdAt: new Date().toISOString()
    });

    store.users.push(user);
    store.identities.push(identity);
    const votingTokens = assignVotingTokens(identity);
    const blockchain = await registerIdentityOnChain(identity.identityCommitment);

    res.status(201).json({
      success: true,
      user,
      identity,
      did: didBundle.did,
      identityCommitment: didBundle.identityCommitment,
      votingTokens,
      blockchain
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { verifyFaceHandler, checkDuplicateHandler, registerIdentityHandler };
