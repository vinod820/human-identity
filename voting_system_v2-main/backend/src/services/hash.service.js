const { faceSalt, phoneSalt } = require("../config/env");
const { sha256, sha256Hex } = require("../utils/crypto");

function normalizeDescriptor(faceDescriptor) {
  return faceDescriptor.map((value) => Number(value).toFixed(4)).join(",");
}

function normalizePhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function generateFaceHash(faceDescriptor) {
  return sha256Hex(normalizeDescriptor(faceDescriptor));
}

function generateBiometricCommitment(faceHash) {
  return sha256Hex(`${faceHash}:${faceSalt}`);
}

function hashPhone(phone) {
  return sha256Hex(`${normalizePhone(phone)}:${phoneSalt}`);
}

function createIdentityCommitment(faceHash, phoneHash, did) {
  return sha256Hex(`${faceHash}:${phoneHash}:${did}`);
}

function createReceiptHash(electionId, candidateId, nullifierHash, timestamp) {
  return sha256Hex(`${electionId}:${candidateId}:${nullifierHash}:${timestamp}`);
}

function createDeviceHash(deviceFingerprint = "demo-device") {
  return sha256Hex(deviceFingerprint);
}

module.exports = {
  normalizeDescriptor,
  normalizePhone,
  generateFaceHash,
  generateBiometricCommitment,
  hashPhone,
  createIdentityCommitment,
  createReceiptHash,
  createDeviceHash,
  sha256
};
