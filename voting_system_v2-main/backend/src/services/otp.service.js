const { store } = require("../models/store");
const { otpSalt } = require("../config/env");
const { normalizePhone, sha256 } = require("./hash.service");

function createOtp(phone) {
  const base = sha256(`${phone}:${Date.now()}:${otpSalt}`);
  return base.slice(0, 6).replace(/[a-f]/g, "7");
}

function sendOtp(phone) {
  const normalizedPhone = normalizePhone(phone);

  if (normalizedPhone.length !== 10) {
    const error = new Error("Enter a valid 10-digit phone number");
    error.status = 400;
    throw error;
  }

  const otp = createOtp(normalizedPhone);
  const record = {
    phone: normalizedPhone,
    otp,
    verified: false,
    createdAt: new Date().toISOString()
  };

  store.otps = store.otps.filter((item) => item.phone !== normalizedPhone);
  store.otps.push(record);

  return {
    success: true,
    phone: normalizedPhone,
    otpPreview: otp,
    message: "OTP generated in demo mode. Swap this service with Twilio or Firebase for production."
  };
}

function verifyOtp(phone, otp) {
  const normalizedPhone = normalizePhone(phone);
  const record = store.otps.find((item) => item.phone === normalizedPhone);

  if (!record) {
    return { success: false, reason: "not_requested" };
  }

  if (record.otp !== String(otp)) {
    return { success: false, reason: "invalid" };
  }

  record.verified = true;
  return { success: true, phone: normalizedPhone };
}

module.exports = { sendOtp, verifyOtp };
