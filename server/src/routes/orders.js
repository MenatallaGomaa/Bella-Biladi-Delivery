import { Router } from "express";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import Item from "../models/Item.js";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middleware/auth.js";

dotenv.config();

const r = Router();
const nano = customAlphabet("0123456789", 6);

/* 
  ✅ Email Transporter Setup
  Uses Gmail in production (.env must have EMAIL_USER + EMAIL_PASS)
  Uses Ethereal automatically when running on localhost
*/
let transporter;

async function initTransporter() {
  if (process.env.NODE_ENV === "production") {
    // --- Gmail setup (for production) ---
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      await transporter.verify();
      console.log("✅ Gmail transporter ready");
    } catch (err) {
      console.error("❌ Gmail transporter failed:", err.message);
    }
  } else {
    // --- Ethereal setup (for local development) ---
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("📨 Using Ethereal test email account");
    console.log(`👉 View emails at: https://ethereal.email/login`);
  }
}
await initTransporter();

// ✅ Create order (cash only) and send email confirmation
r.post("/", async (req, res) => {
  try {
    const { items, customer, notes } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Get item data from DB
    const ids = items.map((i) => i.itemId);
    const dbItems = await Item.find({ _id: { $in: ids } });

    // Validate all items exist
    const missingItems = items.filter((i) => {
      const found = dbItems.find((d) => String(d._id) === String(i.itemId));
      return !found;
    });

    if (missingItems.length > 0) {
      return res.status(400).json({ 
        error: `Some items not found: ${missingItems.map(i => i.itemId).join(", ")}` 
      });
    }

    const cart = items.map((i) => {
      const it = dbItems.find((d) => String(d._id) === String(i.itemId));
      if (!it) {
        throw new Error(`Item ${i.itemId} not found`);
      }
      const priceCents = Number(it.priceCents);
      const qty = Number(i.qty);
      
      if (isNaN(priceCents) || priceCents < 0) {
        throw new Error(`Invalid price for item ${it.name}: ${it.priceCents}`);
      }
      if (isNaN(qty) || qty < 1) {
        throw new Error(`Invalid quantity for item ${it.name}: ${i.qty}`);
      }
      
      return {
        itemId: String(i.itemId),
        name: it.name || "Unknown Item",
        priceCents: Math.round(priceCents),
        qty: Math.round(qty),
      };
    });

    // Calculate totals with proper validation
    const subtotal = cart.reduce((s, i) => {
      const price = Number(i.priceCents);
      const qty = Number(i.qty);
      if (isNaN(price) || isNaN(qty)) {
        throw new Error(`Invalid calculation for item ${i.name}`);
      }
      return s + (price * qty);
    }, 0);
    
    if (isNaN(subtotal) || subtotal < 0) {
      console.error("Invalid subtotal calculation:", { cart, subtotal });
      return res.status(400).json({ error: "Invalid order total calculation" });
    }
    
    const total = Math.round(subtotal); // Add delivery fee if needed later
    const ref = `BB-${new Date().getFullYear()}-${nano()}`;

    // Save order to DB
    // optional user association via Bearer token
    let userId;
    try {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (token) {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || "dev_secret_change_me"
        );
        userId = payload.sub;
      }
    } catch {}

    const order = await Order.create({
      ref,
      userId: userId || undefined,
      items: cart,
      totals: {
        subtotalCents: Math.round(subtotal),
        deliveryFeeCents: 0,
        grandTotalCents: Math.round(total),
      },
      customer: { 
        name: customer?.name || "",
        phone: customer?.phone || "",
        address: customer?.address || "",
        email: customer?.email || "",
        desiredTime: customer?.desiredTime || "So schnell wie möglich",
        notes: notes || customer?.notes || "",
      },
      method: "cash_on_delivery",
    });

    // ✅ Send confirmation email
    if (customer?.email && transporter) {
      const desiredTime = customer?.desiredTime || "So schnell wie möglich";
      const commentBlock = customer?.notes
        ? `<p><b>Hinweis:</b> ${customer.notes}</p>`
        : "";

      const html = `
        <div style="font-family:Arial,sans-serif;color:#333">
          <h2>Hallo ${customer.name || "Kunde"} 👋</h2>
          <p>Vielen Dank für Ihre Bestellung bei <b>BellaBiladi</b>!</p>
          <p><b>Bestellnummer:</b> ${ref}</p>
          <h3>Ihre Bestellung:</h3>
          <ul>
            ${cart
              .map(
                (i) =>
                  `<li>${i.qty}× ${i.name} – €${(
                    (i.priceCents * i.qty) /
                    100
                  ).toFixed(2)}</li>`
              )
              .join("")}
          </ul>
          <p><b>Gesamtbetrag:</b> €${(total / 100).toFixed(2)}</p>
          <p><b>Lieferzeit:</b> ${desiredTime}</p>
          ${commentBlock}
          <p>Wir bereiten Ihre Bestellung gerade vor und liefern bald!</p>
          <br/>
          <p>Mit freundlichen Grüßen,<br><b>BellaBiladi-Team 🍕</b></p>
        </div>
      `;

      const mailOptions = {
        from: `"BellaBiladi 🍕" <${
          process.env.EMAIL_USER || "no-reply@bellabiladi.de"
        }>`,
        to: customer.email,
        subject: "🍕 Ihre BellaBiladi Bestellbestätigung",
        html,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        if (process.env.NODE_ENV !== "production") {
          console.log(
            "📨 Preview email at:",
            nodemailer.getTestMessageUrl(info)
          );
        } else {
          console.log(`✅ Email sent to ${customer.email}`);
        }
      } catch (err) {
        console.error("❌ Email send failed:", err.message);
      }
    }

    res.status(201).json({ ok: true, ref: order.ref, id: order._id });
  } catch (err) {
    console.error("❌ Error creating order:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      body: req.body,
    });
    res.status(500).json({ 
      error: err.message || "Order creation failed",
      details: process.env.NODE_ENV !== "production" ? err.message : undefined
    });
  }
});

// ✅ Test email endpoint (works in both Gmail & Ethereal modes)
r.get("/test-email", async (req, res) => {
  try {
    const to = req.query.to;
    if (!to) return res.status(400).json({ error: "Missing ?to=email" });

    const info = await transporter.sendMail({
      from: `"BellaBiladi 🍕" <${
        process.env.EMAIL_USER || "no-reply@bellabiladi.de"
      }>`,
      to,
      subject: "BellaBiladi Test Email ✅",
      html: `<p>This is a test email from <b>BellaBiladi</b>.</p>`,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    res.json({
      success: true,
      message: "Test email sent",
      preview: preview || null,
    });
  } catch (err) {
    console.error("❌ Error sending test email:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Admin: List orders (optionally filter by status)
r.get("/", requireAdmin, async (req, res) => {
  const { status } = req.query;
  const q = status ? { status } : {};
  const orders = await Order.find(q).sort({ createdAt: -1 }).limit(100);
  res.json(orders);
});

// ✅ Admin: Update order status
r.patch("/:id", requireAdmin, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  res.json(order);
});

// ✅ User: My orders
r.get("/mine", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me"
    );
    const orders = await Order.find({ userId: payload.sub })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(orders);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default r;
