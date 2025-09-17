import { Router } from "express";
import { customAlphabet } from "nanoid";
import Order from "../Order.js";
import Item from "../models/Item.js";
const r = Router();
const nano = customAlphabet("0123456789", 6);

// create order (cash only)
r.post("/", async (req, res) => {
  const { items, customer, notes } = req.body;
  if (!items?.length) return res.status(400).json({ error: "No items" });

  // compute totals from DB prices
  const ids = items.map((i) => i.itemId);
  const dbItems = await Item.find({ _id: { $in: ids } });
  const cart = items.map((i) => {
    const it = dbItems.find((d) => String(d._id) === i.itemId);
    return {
      itemId: i.itemId,
      name: it.name,
      priceCents: it.priceCents,
      qty: i.qty,
    };
  });
  const subtotal = cart.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const ref = `BB-${new Date().getFullYear()}-${nano()}`;

  const order = await Order.create({
    ref,
    items: cart,
    totals: {
      subtotalCents: subtotal,
      deliveryFeeCents: deliveryFee,
      grandTotalCents: total,
    },
    customer: { ...customer, notes },
    method: "cash_on_delivery",
  });

  res.status(201).json({ ok: true, ref: order.ref, id: order._id });
});

// admin list by status
r.get("/", async (req, res) => {
  const { status } = req.query;
  const q = status ? { status } : {};
  const orders = await Order.find(q).sort({ createdAt: -1 }).limit(100);
  res.json(orders);
});

// update status
r.patch("/:id", async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  res.json(order);
});

export default r;
