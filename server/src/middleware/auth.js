import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Check database for current role (not just JWT token)
    const user = await User.findById(payload.sub).select("role email").lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.role !== "admin") {
      console.log(`❌ Admin access denied for ${user.email}, role: ${user.role}`);
      return res.status(403).json({ error: "Admin only" });
    }
    
    // Set user info on request for use in routes
    req.user = { ...payload, role: user.role };
    console.log(`✅ Admin access granted for ${user.email}`);
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    console.error("Admin middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export function getUserIdFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub;
  } catch {
    return null;
  }
}
