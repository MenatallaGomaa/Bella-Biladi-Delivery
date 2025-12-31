import { Router } from "express";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import Item from "../models/Item.js";
import User from "../models/User.js";
import Driver from "../models/Driver.js";
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
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ EMAIL_USER and EMAIL_PASS environment variables are required for production!");
      console.error("❌ Email sending will not work until these are configured.");
      transporter = null;
      return;
    }
    
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      await transporter.verify();
      console.log("✅ Gmail transporter ready and verified");
      console.log(`📧 Email will be sent from: ${process.env.EMAIL_USER}`);
    } catch (err) {
      console.error("❌ Gmail transporter verification failed:", err.message);
      console.error("❌ Please check your EMAIL_USER and EMAIL_PASS credentials");
      transporter = null;
    }
  } else {
    // --- Ethereal setup (for local development) ---
    try {
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
      console.log(`📧 Test account: ${testAccount.user}`);
    } catch (err) {
      console.error("❌ Failed to create Ethereal test account:", err.message);
      transporter = null;
    }
  }
}
await initTransporter();

// ✅ Helper function to send customer confirmation email
async function sendCustomerConfirmation(order, cart, customerInfo, user, subtotal, total) {
  // Check if transporter is initialized
  if (!transporter) {
    console.error("❌ Email transporter not initialized. Cannot send email.");
    return { success: false, error: "Email transporter not initialized" };
  }
  
  // Use user email as primary source (the email they logged in with)
  // Fall back to customerInfo.email if user.email is not available
  const recipientEmail = user?.email || customerInfo?.email;
  
  if (!recipientEmail) {
    console.error("❌ Customer email missing. Cannot send confirmation email.", { 
      orderId: order._id, 
      orderRef: order.ref,
      customerInfo,
      userEmail: user?.email
    });
    return { success: false, error: "Customer email missing" };
  }
  
  console.log(`📧 Attempting to send confirmation email to ${recipientEmail} for order ${order.ref}`);
  console.log(`📧 Email source: ${user?.email ? 'user.email (logged-in email)' : 'customerInfo.email'}`);
  
  const desiredTime = customerInfo.desiredTime || "So schnell wie möglich";
  const commentBlock = customerInfo?.notes
    ? `<p style="margin: 15px 0; padding: 10px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;"><b>📝 Ihre Notiz:</b> ${customerInfo.notes}</p>`
    : "";

  // Calculate estimated delivery time
  const now = new Date();
  let estimatedDeliveryTime = "";
  let estimatedDeliveryText = "";
  
  if (desiredTime === "So schnell wie möglich" || desiredTime.toLowerCase().includes("so schnell")) {
    // ASAP: Add 30-45 minutes
    const estimatedTime = new Date(now.getTime() + 35 * 60 * 1000); // 35 minutes average
    const hours = estimatedTime.getHours().toString().padStart(2, "0");
    const minutes = estimatedTime.getMinutes().toString().padStart(2, "0");
    estimatedDeliveryTime = `${hours}:${minutes} Uhr`;
    estimatedDeliveryText = `ca. 30-45 Minuten (voraussichtlich um ${estimatedDeliveryTime})`;
  } else if (desiredTime.toLowerCase().includes("heute")) {
    // Extract time from "Heute, HH:MM Uhr"
    const timeMatch = desiredTime.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      estimatedDeliveryTime = `${timeMatch[1]}:${timeMatch[2]} Uhr`;
      estimatedDeliveryText = `um ${estimatedDeliveryTime}`;
    } else {
      estimatedDeliveryText = desiredTime;
    }
  } else if (desiredTime.toLowerCase().includes("morgen")) {
    // Extract time from "Morgen, HH:MM Uhr"
    const timeMatch = desiredTime.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      estimatedDeliveryTime = `Morgen um ${timeMatch[1]}:${timeMatch[2]} Uhr`;
      estimatedDeliveryText = estimatedDeliveryTime;
    } else {
      estimatedDeliveryText = desiredTime;
    }
  } else {
    estimatedDeliveryText = desiredTime;
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;background-color:#ffffff;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;">🍕 BellaBiladi</h1>
        <p style="color:#fef3c7;margin:10px 0 0 0;font-size:16px;">Bestellbestätigung</p>
      </div>

      <!-- Content -->
      <div style="padding:30px;background-color:#ffffff;">
        <h2 style="color:#1f2937;margin-top:0;font-size:24px;">Hallo ${customerInfo.name || user.name || "Kunde"} 👋</h2>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;">Vielen Dank für Ihre Bestellung bei <b style="color:#f59e0b;">BellaBiladi</b>! Wir freuen uns, Ihnen köstliches Essen zu liefern.</p>

        <!-- Order Details Box -->
        <div style="background-color:#f9fafb;border:2px solid #f59e0b;border-radius:8px;padding:20px;margin:25px 0;">
          <div style="margin-bottom:15px;">
            <p style="margin:5px 0;color:#6b7280;font-size:14px;">Bestellnummer</p>
            <p style="margin:5px 0;color:#1f2937;font-size:20px;font-weight:bold;letter-spacing:1px;">${order.ref}</p>
          </div>
          <div style="margin-bottom:15px;">
            <p style="margin:5px 0;color:#6b7280;font-size:14px;">Bestelldatum</p>
            <p style="margin:5px 0;color:#1f2937;font-size:16px;">${orderDate}</p>
          </div>
          <div>
            <p style="margin:5px 0;color:#6b7280;font-size:14px;">Gewünschte Lieferzeit</p>
            <p style="margin:5px 0;color:#1f2937;font-size:16px;font-weight:600;">${desiredTime}</p>
          </div>
        </div>

        <!-- Delivery Time Estimation -->
        <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:4px;">
          <p style="margin:0;color:#92400e;font-size:15px;font-weight:600;">⏰ Geschätzte Lieferzeit:</p>
          <p style="margin:5px 0 0 0;color:#78350f;font-size:16px;">${estimatedDeliveryText}</p>
        </div>

        <!-- Order Items -->
        <h3 style="color:#1f2937;font-size:20px;margin:30px 0 15px 0;border-bottom:2px solid #f59e0b;padding-bottom:10px;">Ihre Bestellung:</h3>
        <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          ${cart
            .map(
              (i) => `
                <div style="padding:15px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
                  <div style="flex:1;">
                    <p style="margin:0;color:#1f2937;font-size:16px;font-weight:600;">${i.qty}× ${i.name}</p>
                  </div>
                  <div style="text-align:right;">
                    <p style="margin:0;color:#f59e0b;font-size:16px;font-weight:bold;">€${(
                      (i.priceCents * i.qty) /
                      100
                    ).toFixed(2)}</p>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>

        <!-- Totals -->
        <div style="margin-top:20px;padding-top:20px;border-top:2px solid #e5e7eb;">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <p style="margin:0;color:#6b7280;font-size:16px;">Zwischensumme:</p>
            <p style="margin:0;color:#1f2937;font-size:16px;">€${(subtotal / 100).toFixed(2)}</p>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <p style="margin:0;color:#6b7280;font-size:16px;">Lieferkosten:</p>
            <p style="margin:0;color:#1f2937;font-size:16px;">€0.00</p>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:15px;border-top:2px solid #f59e0b;margin-top:15px;">
            <p style="margin:0;color:#1f2937;font-size:20px;font-weight:bold;">Gesamtbetrag:</p>
            <p style="margin:0;color:#f59e0b;font-size:24px;font-weight:bold;">€${(total / 100).toFixed(2)}</p>
          </div>
        </div>

        <!-- Delivery Address -->
        ${customerInfo?.address ? `
          <div style="margin-top:25px;padding:15px;background-color:#f9fafb;border-radius:8px;">
            <p style="margin:0 0 10px 0;color:#6b7280;font-size:14px;font-weight:600;">📍 Lieferadresse:</p>
            <p style="margin:0;color:#1f2937;font-size:16px;line-height:1.6;">${customerInfo.address}</p>
            ${customerInfo?.phone ? `<p style="margin:10px 0 0 0;color:#1f2937;font-size:16px;">📞 ${customerInfo.phone}</p>` : ""}
          </div>
        ` : ""}

        ${commentBlock}

        <!-- Happy Meal Message -->
        <div style="background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);padding:20px;margin:30px 0;border-radius:8px;text-align:center;">
          <p style="margin:0;color:#78350f;font-size:18px;font-weight:600;">🍽️ Guten Appetit und eine schöne Mahlzeit! 🍽️</p>
          <p style="margin:10px 0 0 0;color:#92400e;font-size:15px;">Wir wünschen Ihnen viel Freude beim Genießen Ihrer Bestellung!</p>
        </div>

        <!-- Footer Message -->
        <p style="color:#4b5563;font-size:15px;line-height:1.6;margin-top:30px;">Wir bereiten Ihre Bestellung mit viel Liebe vor und liefern sie Ihnen pünktlich zu. Falls Sie Fragen haben, kontaktieren Sie uns gerne!</p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:14px;">Mit freundlichen Grüßen,</p>
          <p style="margin:5px 0 0 0;color:#f59e0b;font-size:18px;font-weight:bold;">Ihr BellaBiladi-Team 🍕</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color:#1f2937;padding:20px;text-align:center;border-radius:0 0 8px 8px;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">BellaBiladi | Probstheidaer Straße 21, 04277 Leipzig, Germany</p>
        <p style="margin:5px 0 0 0;color:#9ca3af;font-size:12px;">Phone: 01521 3274837</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"BellaBiladi 🍕" <${
      process.env.EMAIL_USER || "no-reply@bellabiladi.de"
    }>`,
    to: recipientEmail, // Use the logged-in user's email
    subject: "🍕 Ihre BellaBiladi Bestellbestätigung",
    html,
  };

  try {
    console.log(`📧 Sending email to ${recipientEmail}...`);
    console.log(`📧 Email subject: ${mailOptions.subject}`);
    console.log(`📧 Email from: ${mailOptions.from}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== "production") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("📨 Preview email at:", previewUrl);
      console.log(`✅ Confirmation email sent to ${recipientEmail} (test mode - check Ethereal)`);
      console.log(`📧 If you don't see the email, check: https://ethereal.email/login`);
    } else {
      console.log(`✅ Confirmation email sent successfully to ${recipientEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    }
    return { success: true, messageId: info.messageId, emailSentTo: recipientEmail };
  } catch (err) {
    console.error("❌ Customer email send failed:", err.message);
    console.error("❌ Full error details:", err);
    console.error("❌ Email config check:", {
      hasTransporter: !!transporter,
      emailTo: recipientEmail,
      emailFrom: mailOptions.from,
      isProduction: process.env.NODE_ENV === "production",
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      userEmail: user?.email,
      customerInfoEmail: customerInfo?.email
    });
    return { success: false, error: err.message };
  }
}

// ✅ Helper function to send admin notification email
async function sendAdminNotification(order, cart, customerInfo, subtotal, total) {
  if (!transporter) return;
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "admin@bellabiladi.de";
  
  const orderDate = new Date(order.createdAt).toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;background-color:#ffffff;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #dc2626 0%, #991b1b 100%);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;">🚨 NEUE BESTELLUNG</h1>
        <p style="color:#fecaca;margin:10px 0 0 0;font-size:16px;">Bitte sofort bearbeiten</p>
      </div>

      <!-- Content -->
      <div style="padding:30px;background-color:#ffffff;">
        <div style="background-color:#fee2e2;border:2px solid #dc2626;border-radius:8px;padding:20px;margin-bottom:25px;">
          <div style="margin-bottom:15px;">
            <p style="margin:5px 0;color:#991b1b;font-size:14px;font-weight:600;">BESTELLNUMMER</p>
            <p style="margin:5px 0;color:#7f1d1d;font-size:24px;font-weight:bold;letter-spacing:1px;">${order.ref}</p>
          </div>
          <div style="margin-bottom:15px;">
            <p style="margin:5px 0;color:#991b1b;font-size:14px;font-weight:600;">BESTELLDATUM & UHRZEIT</p>
            <p style="margin:5px 0;color:#7f1d1d;font-size:16px;">${orderDate}</p>
          </div>
          <div>
            <p style="margin:5px 0;color:#991b1b;font-size:14px;font-weight:600;">STATUS</p>
            <p style="margin:5px 0;color:#dc2626;font-size:18px;font-weight:bold;text-transform:uppercase;">${order.status || "NEW"}</p>
          </div>
        </div>

        <!-- Customer Information -->
        <h3 style="color:#1f2937;font-size:20px;margin:25px 0 15px 0;border-bottom:2px solid #dc2626;padding-bottom:10px;">👤 KUNDENINFORMATIONEN</h3>
        <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:25px;">
          <p style="margin:8px 0;color:#1f2937;font-size:16px;"><strong>Name:</strong> ${customerInfo.name || "Nicht angegeben"}</p>
          <p style="margin:8px 0;color:#1f2937;font-size:16px;"><strong>📧 E-Mail:</strong> ${customerInfo.email || "Nicht angegeben"}</p>
          <p style="margin:8px 0;color:#1f2937;font-size:16px;"><strong>📞 Telefon:</strong> ${customerInfo.phone || "Nicht angegeben"}</p>
          ${customerInfo.address ? `<p style="margin:8px 0;color:#1f2937;font-size:16px;"><strong>📍 Adresse:</strong> ${customerInfo.address}</p>` : ""}
          <p style="margin:8px 0;color:#1f2937;font-size:16px;"><strong>⏰ Gewünschte Lieferzeit:</strong> ${customerInfo.desiredTime || "So schnell wie möglich"}</p>
          ${customerInfo.notes ? `<p style="margin:8px 0;color:#1f2937;font-size:16px;"><strong>📝 Notiz:</strong> ${customerInfo.notes}</p>` : ""}
        </div>

        <!-- Order Items -->
        <h3 style="color:#1f2937;font-size:20px;margin:25px 0 15px 0;border-bottom:2px solid #dc2626;padding-bottom:10px;">🛒 BESTELLUNG</h3>
        <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:25px;">
          ${cart
            .map(
              (i) => `
                <div style="padding:15px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background-color:${cart.indexOf(i) % 2 === 0 ? "#ffffff" : "#f9fafb"};">
                  <div style="flex:1;">
                    <p style="margin:0;color:#1f2937;font-size:16px;font-weight:600;">${i.qty}× ${i.name}</p>
                  </div>
                  <div style="text-align:right;">
                    <p style="margin:0;color:#dc2626;font-size:16px;font-weight:bold;">€${(
                      (i.priceCents * i.qty) /
                      100
                    ).toFixed(2)}</p>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>

        <!-- Totals -->
        <div style="margin-top:20px;padding:20px;background-color:#fee2e2;border:2px solid #dc2626;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:600;">Zwischensumme:</p>
            <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:600;">€${(subtotal / 100).toFixed(2)}</p>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:600;">Lieferkosten:</p>
            <p style="margin:0;color:#7f1d1d;font-size:16px;font-weight:600;">€0.00</p>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:15px;border-top:2px solid #dc2626;margin-top:15px;">
            <p style="margin:0;color:#7f1d1d;font-size:22px;font-weight:bold;">GESAMTBETRAG:</p>
            <p style="margin:0;color:#dc2626;font-size:28px;font-weight:bold;">€${(total / 100).toFixed(2)}</p>
          </div>
        </div>

        <!-- Payment Method -->
        <div style="margin-top:20px;padding:15px;background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
          <p style="margin:0;color:#92400e;font-size:16px;font-weight:600;">💵 Zahlungsmethode: <span style="color:#78350f;">${order.method === "cash_on_delivery" ? "Barzahlung bei Lieferung" : order.method}</span></p>
        </div>

        <!-- Action Required -->
        <div style="margin-top:30px;padding:20px;background:linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);border-radius:8px;text-align:center;">
          <p style="margin:0;color:#7f1d1d;font-size:18px;font-weight:bold;">⚡ BITTE SOFORT BEARBEITEN ⚡</p>
          <p style="margin:10px 0 0 0;color:#991b1b;font-size:15px;">Bitte bestätigen Sie die Bestellung im Admin-Dashboard und beginnen Sie mit der Zubereitung.</p>
        </div>

        <!-- Footer -->
        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:14px;">Diese E-Mail wurde automatisch generiert.</p>
          <p style="margin:5px 0 0 0;color:#6b7280;font-size:14px;">BellaBiladi Admin System</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color:#1f2937;padding:20px;text-align:center;border-radius:0 0 8px 8px;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">BellaBiladi | Probstheidaer Straße 21, 04277 Leipzig, Germany</p>
        <p style="margin:5px 0 0 0;color:#9ca3af;font-size:12px;">Phone: 01521 3274837</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"BellaBiladi Admin 🍕" <${
      process.env.EMAIL_USER || "no-reply@bellabiladi.de"
    }>`,
    to: adminEmail,
    subject: `🚨 NEUE BESTELLUNG: ${order.ref} - €${(total / 100).toFixed(2)}`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  if (process.env.NODE_ENV !== "production") {
    console.log("📨 Admin email preview at:", nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`✅ Admin notification sent to ${adminEmail}`);
  }
}

// ✅ Create order (cash only) and send email confirmation
r.post("/", async (req, res) => {
  try {
    const { items, customer, notes } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Bitte melde dich an, um eine Bestellung aufzugeben." });
    }

    let user;
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev_secret_change_me"
      );
      user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: "Bitte melde dich an, um eine Bestellung aufzugeben." });
      }
    } catch (err) {
      return res.status(401).json({ error: "Bitte melde dich an, um eine Bestellung aufzugeben." });
    }

    // Get item data from DB (optimized query)
    const ids = items.map((i) => i.itemId);
    const dbItems = await Item.find({ _id: { $in: ids } }).lean().maxTimeMS(5000); // 5 second timeout

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

    // Always use the logged-in user's email for order confirmation
    const customerInfo = {
      name: (customer?.name || user.name || "").toString().trim(),
      phone: (customer?.phone || "").toString().trim(),
      address: (customer?.address || "").toString().trim(),
      email: user.email || customer?.email || "", // Prioritize user.email (the email they logged in with)
      desiredTime: customer?.desiredTime || "So schnell wie möglich",
      notes: notes || customer?.notes || "",
    };
    
    // Log email being used for order
    console.log(`📧 Order ${ref} - Customer email set to: ${customerInfo.email} (from user account)`);

    // Save order to MongoDB with timeout
    const orderStartTime = Date.now();
    const order = await Order.create({
      ref,
      userId: user._id,
      items: cart,
      totals: {
        subtotalCents: Math.round(subtotal),
        deliveryFeeCents: 0,
        grandTotalCents: Math.round(total),
      },
      customer: customerInfo,
      method: "cash_on_delivery",
      channel: req.body.channel || "delivery", // Set channel (pickup or delivery)
    });
    const orderSaveTime = Date.now() - orderStartTime;

    console.log(`✅ Order ${order.ref} saved to MongoDB (ID: ${order._id}) in ${orderSaveTime}ms`);
    console.log(`   Customer: ${customerInfo.name} (${customerInfo.email})`);
    console.log(`   Total: €${(total / 100).toFixed(2)}`);
    console.log(`   Items: ${cart.length} items`);

    // ✅ CRITICAL: Return response IMMEDIATELY - don't wait for anything else
    res.status(201).json({ ok: true, ref: order.ref, id: order._id });
    
    // Log that response was sent
    console.log(`📤 Response sent for order ${order.ref} (total time: ${Date.now() - orderStartTime}ms)`);

    // ✅ Send admin notification email asynchronously AFTER response is sent
    // Customer email will be sent only after admin confirms the order
    setImmediate(() => {
      if (transporter) {
        sendAdminNotification(order, cart, customerInfo, subtotal, total).catch((err) => {
          console.error("❌ Admin email send failed:", err.message);
        });
      }
    });
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
  const orders = await Order.find(q)
    .populate("driverId", "name phone email") // Populate driver information
    .sort({ createdAt: -1 })
    .limit(100);
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
  
  // Emit WebSocket event for order status update
  const io = req.app.get("io");
  if (io) {
    io.to(`order-${order._id}`).emit("order-status-updated", {
      orderId: order._id,
      status: order.status,
      order: order,
    });
    // Also emit to all admins/drivers
    io.emit("order-updated", {
      orderId: order._id,
      status: order.status,
    });
  }
  
  res.json(order);
});

// ✅ Admin: Confirm order (sends customer email and updates status to accepted)
r.post("/:id/confirm", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If already confirmed/accepted, don't send email again
    if (order.status !== "new") {
      return res.json({ 
        success: true, 
        message: "Order already confirmed",
        order 
      });
    }

    // Get user who placed the order
    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate totals from order
    const subtotal = order.totals.subtotalCents || 0;
    const total = order.totals.grandTotalCents || subtotal;

    // Update order status to accepted FIRST (for immediate UI update)
    order.status = "accepted";
    await order.save();

    // Emit WebSocket event for order status update IMMEDIATELY
    const io = req.app.get("io");
    if (io) {
      io.to(`order-${order._id}`).emit("order-status-updated", {
        orderId: order._id,
        status: order.status,
        order: order,
      });
      io.emit("order-updated", {
        orderId: order._id,
        status: order.status,
      });
    }

    // Log order details before sending email
    console.log(`📧 Order confirmation requested for order ${order.ref}`);
    console.log(`📧 Order customer email: ${order.customer?.email || "MISSING"}`);
    console.log(`📧 Order customer name: ${order.customer?.name || "MISSING"}`);
    console.log(`📧 User email (will be used for confirmation): ${user?.email || "MISSING"}`);
    console.log(`📧 Transporter available: ${!!transporter}`);
    console.log(`📧 Environment: ${process.env.NODE_ENV || "production"}`);
    
    // Ensure customerInfo.email is set to user.email (the logged-in email)
    if (order.customer && user?.email) {
      order.customer.email = user.email;
      console.log(`📧 Updated order.customer.email to user.email: ${user.email}`);
    }
    
    // Send response immediately (don't wait for email)
    res.json({
      success: true,
      message: "Order confirmed. Customer email is being sent.",
      order,
    });

    // Send customer confirmation email ASYNCHRONOUSLY (non-blocking)
    sendCustomerConfirmation(
      order,
      order.items,
      order.customer,
      user,
      subtotal,
      total
    ).then((emailResult) => {
      if (emailResult && emailResult.success) {
        console.log(`✅ Confirmation email sent successfully to ${order.customer.email} for order ${order.ref}`);
      } else {
        const errorMsg = emailResult?.error || "Unknown error";
        console.error(`❌ Failed to send confirmation email to ${order.customer.email} for order ${order.ref}:`, errorMsg);
        console.error("Email result:", emailResult);
      }
    }).catch((err) => {
      console.error(`❌ Error sending confirmation email to ${order.customer?.email || "unknown"} for order ${order.ref}:`, err.message);
      console.error("Full error:", err);
    });
  } catch (err) {
    console.error("❌ Error confirming order:", err);
    res.status(500).json({ 
      error: err.message || "Failed to confirm order" 
    });
  }
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

// ✅ Get driver location for a specific order
r.get("/:id/driver-location", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    let user;
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev_secret_change_me"
      );
      user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if user owns the order or is admin
    if (user.role !== "admin" && String(order.userId) !== String(user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!order.driverId) {
      return res.status(404).json({ error: "No driver assigned to this order" });
    }

    const driver = await Driver.findById(order.driverId);
    if (!driver || !driver.currentLocation.latitude) {
      return res.status(404).json({ error: "Driver location not available" });
    }

    res.json({
      latitude: driver.currentLocation.latitude,
      longitude: driver.currentLocation.longitude,
      lastUpdated: driver.currentLocation.lastUpdated,
      driverName: driver.name,
      driverPhone: driver.phone,
    });
  } catch (err) {
    console.error("Error fetching driver location:", err);
    res.status(500).json({ error: "Failed to fetch driver location" });
  }
});

export default r;
