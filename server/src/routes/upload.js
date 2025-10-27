import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import streamifier from "streamifier";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "../middleware/auth.js";

dotenv.config();

const router = Router();

// Configure local storage directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../public/uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage to support Cloudinary streaming
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary if credentials exist
const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// POST /api/upload  (admin only)
router.post("/upload", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    // Prefer Cloudinary when configured
    if (hasCloudinary) {
      const folder = process.env.CLOUDINARY_FOLDER || "bellabiladi";
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error.message);
            return res.status(500).json({ error: "Upload failed" });
          }
          return res.json({ url: result.secure_url, provider: "cloudinary" });
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
      return; // response handled in callback
    }

    // Fallback to local storage
    const filename = `${Date.now()}-${(req.file.originalname || "upload").replace(/\s+/g, "-")}`;
    const destPath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(destPath, req.file.buffer);

    // Public URL served from /public
    const publicUrl = `/public/uploads/${filename}`;
    res.json({ url: publicUrl, provider: "local" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
