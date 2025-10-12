import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import itemsRoutes from "./routes/items.js";
import ordersRoutes from "./routes/orders.js"; // ✅ include orders route

dotenv.config();

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "../public")));

// ✅ Routes
app.use("/api/items", itemsRoutes);
app.use("/api/orders", ordersRoutes);

// ✅ Test route
app.get("/", (req, res) => res.json({ ok: true, name: "BellaBiladi API" }));

// ✅ Connect to MongoDB (ensure it's the same database you used before)
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB connection error:", err));

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
