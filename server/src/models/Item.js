import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    priceCents: { type: Number, required: true },
    imageUrl: String,
    category: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Item", ItemSchema);
