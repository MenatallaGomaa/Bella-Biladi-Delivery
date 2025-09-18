import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  priceCents: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: String,
});

export default mongoose.model("Item", itemSchema);
