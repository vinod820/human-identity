const crypto = require("crypto");

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function sha256Hex(input) {
  return `0x${sha256(input)}`;
}

function randomHex(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString("hex");
}

function createPasswordRecord(password) {
  const salt = randomHex(16);
  return {
    salt,
    hash: hashPassword(password, salt)
  };
}

function verifyPassword(password, salt, expectedHash) {
  const computed = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (computed.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(computed, expected);
}

module.exports = {
  sha256,
  sha256Hex,
  randomHex,
  hashPassword,
  createPasswordRecord,
  verifyPassword
};
