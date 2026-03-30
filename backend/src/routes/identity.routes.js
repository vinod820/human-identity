const express = require("express");
const {
  verifyFaceHandler,
  checkDuplicateHandler,
  registerIdentityHandler
} = require("../controllers/identity.controller");

const router = express.Router();

router.post("/verify-face", verifyFaceHandler);
router.post("/check-duplicate", checkDuplicateHandler);
router.post("/register", registerIdentityHandler);

module.exports = router;
