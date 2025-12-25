import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import nodemailer from "nodemailer";

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = "7d";

let transporter;
async function getTransporter() {
  if (transporter) {
    // Verify transporter is still working
    try {
      await transporter.verify();
      return transporter;
    } catch (err) {
      console.warn("⚠️ Transporter verification failed, recreating...", err.message);
      transporter = null; // Reset to recreate
    }
  }
  
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    // Check if email credentials are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const errorMsg = "EMAIL_USER and EMAIL_PASS environment variables are required for production email sending";
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log("📧 Initializing Gmail transporter...");
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    
    // Verify Gmail connection
    try {
      await transporter.verify();
      console.log("✅ Gmail transporter verified and ready");
      console.log(`📧 Email will be sent from: ${process.env.EMAIL_USER}`);
    } catch (err) {
      console.error("❌ Gmail transporter verification failed:", err.message);
      console.error("   Please check EMAIL_USER and EMAIL_PASS credentials");
      transporter = null; // Reset transporter on failure
      throw new Error(`Gmail authentication failed: ${err.message}. Please check EMAIL_USER and EMAIL_PASS.`);
    }
  } else {
    // Development mode - use Ethereal test emails
    console.log("📧 Initializing Ethereal test email transporter...");
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log("✅ Ethereal transporter initialized");
      console.log(`📨 View test emails at: https://ethereal.email/login`);
      console.log(`   Test account: ${testAccount.user}`);
    } catch (err) {
      console.error("❌ Failed to create Ethereal test account:", err.message);
      transporter = null;
      throw new Error(`Failed to initialize test email transporter: ${err.message}`);
    }
  }
  return transporter;
}

function signToken(user) {
  // Ensure _id is always a string for consistent JWT storage
  const userId = user._id ? user._id.toString() : user._id;
  return jwt.sign({ sub: userId, role: user.role || "user" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });
    
    // Trim and normalize inputs
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing)
      return res.status(409).json({ error: "Diese E-Mail ist bereits registriert. Bitte einloggen." });
    
    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

    const emailVerificationToken = crypto.randomBytes(20).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      passwordHash,
      emailVerificationToken,
      emailVerificationExpires,
    });

    // Ensure _id is converted to string for JWT token
    const token = signToken({ _id: user._id.toString(), role: user.role || "user" });

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
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Trim and normalize inputs (same as registration)
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user) {
      console.log(`Login attempt failed: User not found for email ${trimmedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user has a password hash (in case of old records)
    if (!user.passwordHash) {
      console.log(`Login attempt failed: User ${user.email} has no password hash`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(trimmedPassword, user.passwordHash);
    
    if (!ok) {
      console.log(`Login attempt failed: Password mismatch for email ${trimmedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Ensure role is set (default to "user" if not set)
    const userRole = user.role || "user";
    console.log(`✅ Login successful for ${trimmedEmail}, role: ${userRole}`);
    console.log(`   User ID: ${user._id} (type: ${typeof user._id}, string: ${user._id.toString()})`);
    
    // Ensure _id is converted to string for JWT token
    const token = signToken({ _id: user._id.toString(), role: userRole });
    res.json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: userRole, emailVerified: user.emailVerified || false },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Profile (basic, no orders included here)
router.get("/profile", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log("Profile request - Token payload:", { sub: payload.sub, role: payload.role, subType: typeof payload.sub });
    
    // Try to find user by ID - Mongoose should handle string/ObjectId conversion
    let user = null;
    
    // Try multiple ways to find the user
    if (payload.sub) {
      // First try: Direct findById (Mongoose handles string/ObjectId conversion)
      user = await User.findById(payload.sub).lean();
      
      // Second try: If not found, try with ObjectId conversion
      if (!user && mongoose.Types.ObjectId.isValid(payload.sub)) {
        console.log(`   Trying to find user with ObjectId conversion: ${payload.sub}`);
        try {
          const objectId = new mongoose.Types.ObjectId(payload.sub);
          user = await User.findById(objectId).lean();
        } catch (err) {
          console.log(`   ObjectId conversion failed: ${err.message}`);
        }
      }
      
      // Third try: Try as string
      if (!user) {
        console.log(`   Trying to find user with ID as string: ${payload.sub}`);
        user = await User.findOne({ _id: payload.sub.toString() }).lean();
      }
    }
    
    // If still not found, log details and return error
    if (!user) {
      console.error(`❌ User not found in database. User ID from token: ${payload.sub} (type: ${typeof payload.sub})`);
      // Check if user exists with different ID format
      const allUsers = await User.find({}).select("_id email name").limit(10).lean();
      console.log(`Available users in database (${allUsers.length}):`, allUsers.map(u => ({ 
        id: u._id.toString(), 
        idType: typeof u._id,
        email: u.email,
        name: u.name 
      })));
      
      return res.status(404).json({ error: "User not found. Please log in again." });
    }
    
    const { passwordHash, ...safe } = user;
    // Ensure role is always included (default to "user" if not set)
    if (!safe.role) {
      safe.role = "user";
    }
    console.log("✅ Profile request successful for user:", safe.email, "Role:", safe.role);
    res.json(safe);
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      console.error("Profile error - Invalid/expired token:", err.message);
      return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
    }
    console.error("Profile error:", err.message, err.stack);
    return res.status(500).json({ error: "Internal server error" });
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
  try {
    const emailInput = (req.body.email || "").trim().toLowerCase();
    if (!emailInput) {
      return res.status(400).json({ error: "E-Mail-Adresse ist erforderlich" });
    }
    
    console.log(`📧 Password reset requested for: ${emailInput}`);
    
    const user = await User.findOne({ email: emailInput });
    if (!user) {
      // Don't reveal if user exists (security best practice)
      console.log(`   User not found for email: ${emailInput}`);
      return res.json({ success: true, message: "Wenn diese E-Mail registriert ist, wurde ein Link gesendet." });
    }
    
    console.log(`   User found: ${user.email} (ID: ${user._id})`);
    
    // Generate reset token
    user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();
    
    console.log(`   Reset token generated: ${user.resetPasswordToken.substring(0, 10)}...`);
    
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password?token=${user.resetPasswordToken}`;
    
    console.log(`   Reset URL: ${resetUrl}`);
    
    let emailPreviewUrl = null;
    let emailSent = false;
    let emailError = null;
    
    // Try to send email
    try {
      console.log("   Attempting to get email transporter...");
      const t = await getTransporter();
      
      if (!t) {
        throw new Error("Email transporter is not initialized");
      }
      
      console.log(`   Sending password reset email to: ${user.email}`);
      
      const mailOptions = {
        from: `BellaBiladi <${process.env.EMAIL_USER || "no-reply@bellabiladi.de"}>`,
        to: user.email,
        subject: "Passwort zurücksetzen - Bella Biladi",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .button:hover { background-color: #d97706; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
              .link { word-break: break-all; color: #2563eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Passwort zurücksetzen</h2>
              <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
              <p>Klicken Sie auf den folgenden Button, um Ihr Passwort zurückzusetzen:</p>
              <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
              <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
              <p class="link">${resetUrl}</p>
              <p><strong>Dieser Link ist 1 Stunde gültig.</strong></p>
              <p>Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte.</p>
              <div class="footer">
                <p>Mit freundlichen Grüßen,<br>Bella Biladi Team</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Passwort zurücksetzen\n\nKlicken Sie auf diesen Link, um Ihr Passwort zurückzusetzen:\n${resetUrl}\n\nDieser Link ist 1 Stunde gültig.\n\nWenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail bitte.`
      };
      
      const info = await t.sendMail(mailOptions);
      
      emailSent = true;
      
      // In development, get the Ethereal preview URL
      if (process.env.NODE_ENV !== "production") {
        emailPreviewUrl = nodemailer.getTestMessageUrl(info);
        console.log("✅ Password reset email sent to Ethereal:");
        console.log("   Preview URL:", emailPreviewUrl);
        console.log("   Reset URL:", resetUrl);
      } else {
        console.log(`✅ Password reset email sent successfully to: ${user.email}`);
        console.log(`   Message ID: ${info.messageId}`);
      }
    } catch (e) {
      emailError = e.message;
      emailSent = false;
      console.error("❌ Email send failed:", e.message);
      console.error("   Error stack:", e.stack);
      
      // Log detailed error information for debugging
      if (process.env.NODE_ENV === "production") {
        console.error("   EMAIL_USER set:", !!process.env.EMAIL_USER);
        console.error("   EMAIL_PASS set:", !!process.env.EMAIL_PASS);
        console.error("   EMAIL_USER value:", process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : "NOT SET");
      }
      
      // In development, we can be more explicit about errors
      if (process.env.NODE_ENV !== "production") {
        console.error("   This is a development environment - check Ethereal email account");
      }
    }
    
    // In development, return the preview URL so frontend can show it
    if (process.env.NODE_ENV !== "production") {
      const response = { 
        success: emailSent, 
        message: emailSent ? "E-Mail wurde gesendet." : "E-Mail konnte nicht gesendet werden.",
        resetUrl: resetUrl // Always return reset URL in development for testing
      };
      
      if (emailPreviewUrl) {
        response.previewUrl = emailPreviewUrl;
      }
      
      if (emailError) {
        response.emailError = emailError;
      }
      
      return res.json(response);
    }
    
    // In production, always return success (security best practice - don't reveal if email exists)
    // But log the error for admin debugging
    return res.json({ 
      success: true, 
      message: "Wenn diese E-Mail registriert ist, wurde ein Link gesendet."
    });
  } catch (err) {
    console.error("❌ Forgot password endpoint error:", err.message);
    console.error("   Stack:", err.stack);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." });
  }
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

// Change password (authenticated)
router.post("/change-password", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Bitte aktuelles und neues Passwort angeben" });
  }

  const trimmedNewPassword = newPassword.trim();
  if (trimmedNewPassword.length < 6) {
    return res.status(400).json({ error: "Das neue Passwort muss mindestens 6 Zeichen lang sein" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const hasPassword = user.passwordHash;
    if (!hasPassword) {
      return res.status(400).json({ error: "Es ist kein Passwort hinterlegt" });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "Das aktuelle Passwort ist falsch" });
    }

    user.passwordHash = await bcrypt.hash(trimmedNewPassword, 10);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Ungültiges oder abgelaufenes Token" });
    }
    console.error("Change password error:", err.message);
    res.status(500).json({ error: "Passwort konnte nicht geändert werden" });
  }
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
