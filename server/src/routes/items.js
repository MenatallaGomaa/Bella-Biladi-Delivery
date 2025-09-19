/*import express from "express";
import Item from "../models/Item.js";

const router = express.Router();

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new item (useful to seed menu)
router.post("/", async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;*/
/*
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import itemsRoutes from "./routes/items.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static images from public folder
app.use("/images", express.static("public"));

// Routes
app.use("/api/items", itemsRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ ok: true, name: "bb-server" });
});

// DB connection
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/bb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
*/

import express from "express";
import Item from "../models/Item.js"; // ✅ one level up, into models

const router = express.Router();

// Get all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new item
router.post("/", async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete all items
router.delete("/", async (req, res) => {
  try {
    await Item.deleteMany({});
    res.json({ message: "All items deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
