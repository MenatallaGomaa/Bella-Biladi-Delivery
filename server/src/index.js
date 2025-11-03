import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import itemsRoutes from "./routes/items.js";
import ordersRoutes from "./routes/orders.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "../public")));

// ✅ API routes
app.use("/api/items", itemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api", authRoutes);
app.use("/api", uploadRoutes);

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB connection error:", err));

// ✅ Serve frontend build (React)
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// For any non-API routes, serve React index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server ready on port ${PORT}`)
);
