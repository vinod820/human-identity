const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  otpSalt: process.env.OTP_SALT || "civicproof-demo-otp-salt",
  phoneSalt: process.env.PHONE_SALT || "civicproof-demo-phone-salt",
  faceSalt: process.env.FACE_SALT || "civicproof-demo-face-salt",
  nullifierSecret: process.env.NULLIFIER_SECRET || "civicproof-demo-nullifier-secret"
};
