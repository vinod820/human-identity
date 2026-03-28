const { store } = require("../models/store");
const { otpSalt } = require("../config/env");
const { sha256 } = require("./hash.service");

function createOtp(phone) {
  const base = sha256(`${phone}:${Date.now()}:${otpSalt}`);
  return base.slice(0, 6).replace(/[a-f]/g, "7");
}

function sendOtp(phone) {
  const otp = createOtp(phone);
  const record = {
    phone,
    otp,
    verified: false,
    createdAt: new Date().toISOString()
  };

  store.otps = store.otps.filter((item) => item.phone !== phone);
  store.otps.push(record);

  return {
    success: true,
    phone,
    otpPreview: otp,
    message: "OTP generated in demo mode. Swap this service with Twilio or Firebase for production."
  };
}

function verifyOtp(phone, otp) {
  const record = store.otps.find((item) => item.phone === phone);

  if (!record || record.otp !== otp) {
    return { success: false };
  }

  record.verified = true;
  return { success: true };
}

module.exports = { sendOtp, verifyOtp };
