import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  priceCents: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: String,
  order: { type: Number, default: 0 }, // Order field to preserve seed.js order
});

export default mongoose.model("Item", itemSchema);
