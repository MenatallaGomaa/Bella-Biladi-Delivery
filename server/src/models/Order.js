import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ref: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: [
        "new",
        "accepted",
        "preparing",
        "on_the_way",
        "delivered",
        "canceled",
      ],
      default: "new",
    },
    items: [
      {
        itemId: String,
        name: String,
        priceCents: Number,
        qty: Number,
      },
    ],
    totals: {
      subtotalCents: Number,
      deliveryFeeCents: { type: Number, default: 0 },
      grandTotalCents: Number,
    },
    customer: {
      name: String,
      phone: String,
      address: String,
      email: String,
      desiredTime: String,
      notes: String,
    },
    method: { type: String, default: "cash_on_delivery" },
    channel: { type: String, default: "web" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
