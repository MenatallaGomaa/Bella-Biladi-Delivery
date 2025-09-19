/*import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import itemsRoutes from "./routes/items.js"; // ✅ only one "routes"

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // ✅ serve images from /public

// Routes
app.use("/api/items", itemsRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ ok: true, name: "bb-server" });
});

// DB connection
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/bb")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
*/

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import itemsRoutes from "./routes/items.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images
app.use("/public", express.static(path.join(__dirname, "../public")));

// Routes
app.use("/api/items", itemsRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ ok: true, name: "bb-server" });
});

// DB connection
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/bb")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
