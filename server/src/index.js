import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import itemsRoutes from "./routes/items.js";
import ordersRoutes from "./routes/orders.js";
import authRoutes from "./routes/auth.js";
import uploadRoutes from "./routes/upload.js";
import driversRoutes from "./routes/drivers.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn("⚠️ No CORS_ORIGIN configured. Only localhost origins will be allowed.");
} else {
  console.log("🌐 Allowed CORS origins:", allowedOrigins);
}

// Always allow localhost in development
const localhostOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Always allow localhost in development
    if (localhostOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed origins list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return callback(null, true);
    }
    
    console.warn(`🚫 CORS blocked origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "../public")));

// ✅ WebSocket setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",").map(o => o.trim()).filter(Boolean) || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
});

// Make io available to routes
app.set("io", io);

// ✅ Health check endpoint for keep-alive pings
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ✅ API routes
app.use("/api/items", itemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/drivers", driversRoutes);
app.use("/api", authRoutes);
app.use("/api", uploadRoutes);

// ✅ MongoDB connection
// Default to 'test' database if no database specified (MongoDB Atlas default)
let mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/test";

// Ensure database name is specified in connection string
// MongoDB Atlas format: mongodb+srv://user:pass@cluster.net/database?options
if (mongoUrl.includes("mongodb+srv://") || mongoUrl.includes("mongodb://")) {
  try {
    const url = new URL(mongoUrl.replace("mongodb+srv://", "https://").replace("mongodb://", "http://"));
    const pathname = url.pathname;
    
    // Check if database name is already in the path
    // Pathname format: /database or /database/ or empty
    const dbName = pathname.split("/").filter(p => p && !p.includes("?")).pop();
    
    if (!dbName || dbName.length < 2) {
      // No database name found, add /test before query params (MongoDB Atlas default)
      const queryIndex = mongoUrl.indexOf("?");
      if (queryIndex > 0) {
        // Remove trailing slash before query params, then add /test
        const baseUrl = mongoUrl.substring(0, queryIndex).replace(/\/+$/, "");
        mongoUrl = baseUrl + "/test" + mongoUrl.substring(queryIndex);
      } else {
        // Remove trailing slash, then add /test
        mongoUrl = mongoUrl.replace(/\/+$/, "") + "/test";
      }
    }
  } catch (e) {
    // If URL parsing fails, try simple string manipulation
    if (!mongoUrl.match(/\/[^\/\?]+(\?|$)/)) {
      const queryIndex = mongoUrl.indexOf("?");
      if (queryIndex > 0) {
        mongoUrl = mongoUrl.substring(0, queryIndex) + "/bb" + mongoUrl.substring(queryIndex);
      } else {
        mongoUrl = mongoUrl.replace(/\/+$/, "") + "/bb";
      }
    }
  }
}

console.log("🔍 Connecting to MongoDB:", mongoUrl.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")); // Hide credentials in logs

mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log("📊 Database:", mongoose.connection.db.databaseName);
    console.log("📋 Collections:", Object.keys(mongoose.connection.collections));
  })
  .catch((err) => console.error("❌ DB connection error:", err));

// ✅ Serve frontend build (React)
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  console.log("📦 Serving static files from", clientDistPath);
  app.use(express.static(clientDistPath));

  // For any non-API routes, serve React index.html
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/public")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  console.log("⚠️ client/dist not found – skipping static file serving (API-only mode)");
}

// ✅ WebSocket connection handling
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });

  // Join room for order updates
  socket.on("join-order-room", (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`📦 Client ${socket.id} joined order room: order-${orderId}`);
  });

  // Leave order room
  socket.on("leave-order-room", (orderId) => {
    socket.leave(`order-${orderId}`);
    console.log(`📦 Client ${socket.id} left order room: order-${orderId}`);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server ready on port ${PORT}`)
);
