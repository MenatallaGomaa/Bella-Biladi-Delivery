import express from "express";
import Item from "../models/Item.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/items
 * Fetch all items
 */
router.get("/", async (req, res) => {
  try {
    const items = await Item.find().sort({ order: 1, _id: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, description, priceCents, category, imageUrl } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name ist erforderlich" });
    }
    if (typeof category !== "string" || !category.trim()) {
      return res.status(400).json({ error: "Kategorie ist erforderlich" });
    }
    if (typeof priceCents !== "number" || Number.isNaN(priceCents)) {
      return res.status(400).json({ error: "Preis (priceCents) ist erforderlich" });
    }

    const item = await Item.create({
      name: name.trim(),
      description: description?.trim(),
      priceCents: Math.round(priceCents),
      category: category.trim(),
      imageUrl: imageUrl?.trim(),
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/items
 * Delete all items
 */
router.delete("/", requireAdmin, async (req, res) => {
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
router.delete("/:id", requireAdmin, async (req, res) => {
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
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.name === "string") update.name = req.body.name.trim();
    if (typeof req.body.description === "string") {
      const trimmed = req.body.description.trim();
      update.description = trimmed || undefined;
    }
    if (typeof req.body.category === "string") update.category = req.body.category.trim();
    if (typeof req.body.imageUrl === "string") {
      const trimmed = req.body.imageUrl.trim();
      update.imageUrl = trimmed || undefined;
    }
    if (typeof req.body.priceCents === "number" && !Number.isNaN(req.body.priceCents)) {
      update.priceCents = Math.round(req.body.priceCents);
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "Keine g?ltigen ?nderungen ?bermittelt" });
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
