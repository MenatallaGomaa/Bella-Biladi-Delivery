import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, name: "bb-server" });
});

const { MONGO_URL, PORT = 4000 } = process.env;

try {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");
  app.listen(PORT, () =>
    console.log(`🚀 API running on http://localhost:${PORT}`)
  );
} catch (err) {
  console.error("❌ Failed to start server", err);
  process.exit(1);
}
