const { hashPhone } = require("../services/hash.service");
const {
  getAccountSession,
  loginAccount,
  logoutAccountSession,
  recoverAccount,
  signupAccount
} = require("../services/account.service");
const { sendOtp, verifyOtp } = require("../services/otp.service");
const { ensureFields } = require("../utils/validator");

function signupHandler(req, res, next) {
  try {
    ensureFields(req.body, ["fullName", "email", "password"]);
    res.status(201).json(signupAccount(req.body));
  } catch (error) {
    next(error);
  }
}

function loginHandler(req, res, next) {
  try {
    ensureFields(req.body, ["email", "password"]);
    res.json(loginAccount(req.body));
  } catch (error) {
    next(error);
  }
}

function recoverHandler(req, res, next) {
  try {
    ensureFields(req.body, ["email", "phone", "password"]);
    res.json(recoverAccount(req.body));
  } catch (error) {
    next(error);
  }
}

function sessionHandler(req, res, next) {
  try {
    ensureFields(req.query, ["token"]);
    res.json(getAccountSession(req.query.token));
  } catch (error) {
    next(error);
  }
}

function logoutHandler(req, res, next) {
  try {
    ensureFields(req.body, ["token"]);
    res.json(logoutAccountSession(req.body.token));
  } catch (error) {
    next(error);
  }
}

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
      const message =
        result.reason === "not_requested"
          ? "Send OTP first"
          : "Invalid OTP";

      return res.status(400).json({ success: false, message });
    }

    return res.json({
      success: true,
      phoneHash: hashPhone(result.phone)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signupHandler,
  loginHandler,
  recoverHandler,
  sessionHandler,
  logoutHandler,
  sendOtpHandler,
  verifyOtpHandler
};
