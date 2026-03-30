function ensureFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");

  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

module.exports = { ensureFields };
