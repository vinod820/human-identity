const { hashPhone } = require("../services/hash.service");
const { sendOtp, verifyOtp } = require("../services/otp.service");
const { ensureFields } = require("../utils/validator");

function sendOtpHandler(req, res, next) {
  try {
    ensureFields(req.body, ["phone"]);
    res.json(sendOtp(req.body.phone));
  } catch (error) {
    next(error);
  }
}

function verifyOtpHandler(req, res, next) {
  try {
    ensureFields(req.body, ["phone", "otp"]);
    const result = verifyOtp(req.body.phone, req.body.otp);

    if (!result.success) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    return res.json({
      success: true,
      phoneHash: hashPhone(req.body.phone)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { sendOtpHandler, verifyOtpHandler };
