const { issueDid } = require("../services/did.service");
const { ensureFields } = require("../utils/validator");

function createDidHandler(req, res, next) {
  try {
    ensureFields(req.body, ["faceHash", "phoneHash"]);
    res.json(issueDid(req.body.faceHash, req.body.phoneHash));
  } catch (error) {
    next(error);
  }
}

module.exports = { createDidHandler };
