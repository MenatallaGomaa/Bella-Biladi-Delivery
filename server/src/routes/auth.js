import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/User.js";
import nodemailer from "nodemailer";

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = "7d";

let transporter;
async function getTransporter() {
  if (transporter) return transporter;
  if (process.env.NODE_ENV === "production") {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
  return transporter;
}

function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);

    const emailVerificationToken = crypto.randomBytes(20).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      emailVerificationToken,
      emailVerificationExpires,
    });

    const token = signToken(user);

    try {
      const t = await getTransporter();
      const url = `${process.env.APP_BASE_URL || "http://localhost:5173"}/verify-email?token=${emailVerificationToken}`;
      const info = await t.sendMail({
        from: `BellaBiladi <${process.env.EMAIL_USER || "no-reply@bellabiladi.de"}>`,
        to: user.email,
        subject: "E-Mail bestätigen",
        html: `<p>Bitte bestätige deine E-Mail: <a href="${url}">E-Mail bestätigen</a></p>`
      });
      if (process.env.NODE_ENV !== "production") {
        console.log("Verify preview:", nodemailer.getTestMessageUrl(info));
      }
    } catch (e) {
      console.warn("Email send failed:", e.message);
    }

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
  });
});

// Profile (basic, no orders included here)
router.get("/profile", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Verify email
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  res.json({ success: true });
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.json({ success: true });
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);
  await user.save();
  try {
    const t = await getTransporter();
    const url = `${process.env.APP_BASE_URL || "http://localhost:5173"}/reset-password?token=${user.resetPasswordToken}`;
    const info = await t.sendMail({
      from: `BellaBiladi <${process.env.EMAIL_USER || "no-reply@bellabiladi.de"}>`,
      to: user.email,
      subject: "Passwort zurücksetzen",
      html: `<p>Passwort zurücksetzen: <a href="${url}">Link</a></p>`
    });
    if (process.env.NODE_ENV !== "production") {
      console.log("Reset preview:", nodemailer.getTestMessageUrl(info));
    }
  } catch (e) {
    console.warn("Email send failed:", e.message);
  }
  res.json({ success: true });
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ success: true });
});

// Update addresses
router.put("/profile/addresses", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { addresses } = req.body;
    const user = await User.findByIdAndUpdate(
      payload.sub,
      { addresses: addresses || [] },
      { new: true }
    ).lean();
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
