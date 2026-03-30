const express = require("express");
const cors = require("cors");
const { connectDb } = require("./config/db");
const { clientOrigins, port } = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const identityRoutes = require("./routes/identity.routes");
const voteRoutes = require("./routes/vote.routes");
const fraudRoutes = require("./routes/fraud.routes");
const didRoutes = require("./routes/did.routes");

async function bootstrap() {
  await connectDb();

  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || clientOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "civicproof-backend" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/identity", identityRoutes);
  app.use("/api/vote", voteRoutes);
  app.use("/api/fraud", fraudRoutes);
  app.use("/api/did", didRoutes);

  app.use((error, _req, res, _next) => {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Server error"
    });
  });

  app.listen(port, () => {
    console.log(`CivicProof backend listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
