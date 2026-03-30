const User = require("../models/User");
const Identity = require("../models/Identity");
const { store } = require("../models/store");
const { findSimilarFace, verifyFace } = require("../services/face.service");
const { logFraudEvent } = require("../services/fraud.service");
const { createDeviceHash } = require("../services/hash.service");
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

    const existingIdentity = store.identities.find(
      (identity) => identity.faceHash === req.body.faceHash && identity.phoneHash === req.body.phoneHash
    );
    const duplicateFace = store.identities.some(
      (identity) => identity.faceHash === req.body.faceHash && identity.phoneHash !== req.body.phoneHash
    );
    const duplicatePhone = store.identities.some(
      (identity) => identity.phoneHash === req.body.phoneHash && identity.faceHash !== req.body.faceHash
    );
    const similarity = req.body.faceDescriptor?.length ? findSimilarFace(req.body.faceDescriptor) : { matched: false, score: 0 };
    const conflictingSimilarity = Boolean(
      similarity.matched && similarity.userId && similarity.userId !== existingIdentity?.userId
    );

    if (duplicateFace) {
      logFraudEvent("duplicate_face", "unknown", { faceHash: req.body.faceHash }, 90);
    }

    if (duplicatePhone) {
      logFraudEvent("duplicate_phone", "unknown", { phoneHash: req.body.phoneHash }, 85);
    }

    if (conflictingSimilarity) {
      logFraudEvent("suspicious_behavior", similarity.userId || "unknown", { similarity }, 70);
    }

    res.json({
      existingIdentity: existingIdentity
        ? {
            did: existingIdentity.did,
            identityCommitment: existingIdentity.identityCommitment,
            userId: existingIdentity.userId,
            status: existingIdentity.status
          }
        : null,
      duplicateFace,
      duplicatePhone,
      similarFace: similarity,
      allowed: Boolean(existingIdentity) || !(duplicateFace || duplicatePhone || conflictingSimilarity)
    });
  } catch (error) {
    next(error);
  }
}

function registerIdentityHandler(req, res, next) {
  try {
    ensureFields(req.body, ["did", "faceHash", "phoneHash", "identityCommitment"]);

    const existingIdentity = store.identities.find(
      (identity) => identity.faceHash === req.body.faceHash && identity.phoneHash === req.body.phoneHash
    );

    if (existingIdentity) {
      const existingUser = store.users.find((user) => user._id === existingIdentity.userId);

      existingIdentity.faceDescriptor = req.body.faceDescriptor || existingIdentity.faceDescriptor || [];
      existingIdentity.deviceHash = createDeviceHash(req.body.deviceFingerprint);
      existingIdentity.biometricCommitment = req.body.biometricCommitment || existingIdentity.biometricCommitment || "";
      existingIdentity.status = "active";

      if (existingUser) {
        existingUser.walletAddress = req.body.walletAddress || existingUser.walletAddress || "";
        existingUser.isPhoneVerified = true;
        existingUser.isHumanVerified = true;
        existingUser.isUnique = true;
      }

      return res.status(200).json({
        success: true,
        resumed: true,
        user: existingUser || null,
        identity: existingIdentity
      });
    }

    const user = new User({
      _id: `user_${store.users.length + 1}`,
      did: req.body.did,
      walletAddress: req.body.walletAddress || "",
      phoneHash: req.body.phoneHash,
      faceHash: req.body.faceHash,
      identityCommitment: req.body.identityCommitment,
      isPhoneVerified: true,
      isHumanVerified: true,
      isUnique: true,
      trustScore: 92,
      createdAt: new Date().toISOString()
    });

    const identity = new Identity({
      _id: `identity_${store.identities.length + 1}`,
      userId: user._id,
      did: req.body.did,
      faceEmbeddingRef: "encrypted://demo-face-ref",
      faceDescriptor: req.body.faceDescriptor || [],
      faceHash: req.body.faceHash,
      phoneHash: req.body.phoneHash,
      deviceHash: createDeviceHash(req.body.deviceFingerprint),
      identityCommitment: req.body.identityCommitment,
      biometricCommitment: req.body.biometricCommitment || "",
      status: "active",
      createdAt: new Date().toISOString()
    });

    store.users.push(user);
    store.identities.push(identity);

    res.status(201).json({
      success: true,
      user,
      identity
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { verifyFaceHandler, checkDuplicateHandler, registerIdentityHandler };
