import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import itemsRoutes from "./routes/items.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/items", itemsRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ ok: true, name: "bb-server" });
});

// DB connection
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/bb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
