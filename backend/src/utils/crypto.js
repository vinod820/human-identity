const crypto = require("crypto");

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function sha256Hex(input) {
  return `0x${sha256(input)}`;
}

module.exports = { sha256, sha256Hex };
