const dotenv = require("dotenv");

dotenv.config();

const defaultClientOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001"
];

const configuredOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

module.exports = {
  port: process.env.PORT || 4000,
  clientOrigins: [...new Set([...defaultClientOrigins, ...configuredOrigins])],
  otpSalt: process.env.OTP_SALT || "civicproof-demo-otp-salt",
  phoneSalt: process.env.PHONE_SALT || "civicproof-demo-phone-salt",
  faceSalt: process.env.FACE_SALT || "civicproof-demo-face-salt",
  nullifierSecret: process.env.NULLIFIER_SECRET || "civicproof-demo-nullifier-secret"
};
