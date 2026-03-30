const express = require("express");
const {
  loginHandler,
  logoutHandler,
  recoverHandler,
  sendOtpHandler,
  sessionHandler,
  signupHandler,
  verifyOtpHandler
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signupHandler);
router.post("/login", loginHandler);
router.post("/recover", recoverHandler);
router.get("/session", sessionHandler);
router.post("/logout", logoutHandler);
router.post("/send-otp", sendOtpHandler);
router.post("/verify-otp", verifyOtpHandler);

module.exports = router;
