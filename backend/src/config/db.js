async function connectDb() {
  return {
    provider: "in-memory",
    status: "connected"
  };
}

module.exports = { connectDb };
