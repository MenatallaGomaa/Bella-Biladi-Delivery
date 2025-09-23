import express from "express";
import Item from "../models/Item.js"; // ✅ import your Item model

const router = express.Router();

/**
 * GET /api/items
 * Fetch all items
 */
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/items
 * Add a new item
 */
router.post("/", async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/items
 * Delete all items
 */
router.delete("/", async (req, res) => {
  try {
    await Item.deleteMany({});
    res.json({ message: "All items deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/items/:id
 * Delete a single item by ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted", deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/items/:id
 * Update a single item by ID (e.g., change price, description, etc.)
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated document
    );
    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
