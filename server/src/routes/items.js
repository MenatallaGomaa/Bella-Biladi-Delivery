import { Router } from "express";
import Item from "../models/Item.js";
const r = Router();

// public: list active items
r.get("/", async (_req, res) => {
  const items = await Item.find({ isActive: true }).sort({
    category: 1,
    name: 1,
  });
  res.json(items);
});

// admin (for now open): create item
r.post("/", async (req, res) => {
  const item = await Item.create(req.body);
  res.status(201).json(item);
});

// admin: update item
r.put("/:id", async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(item);
});

// admin: delete
r.delete("/:id", async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default r;
