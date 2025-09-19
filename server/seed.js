import mongoose from "mongoose";
import Item from "./src/models/Item.js";

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URL || "mongodb://localhost:27017/bb",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to MongoDB");

    // Clear existing items
    await Item.deleteMany({});
    console.log("🗑️ Old items deleted");

    // Insert 1 Pizza Margherita
    const margherita = new Item({
      name: "Pizza Margherita",
      description: "Klassische Pizza mit Tomaten und Käse",
      priceCents: 640,
      category: "Pizza",
      imageUrl: "/images/margherita.jpeg", // ✅ Must match your server/public/margherita.jpeg
    });

    await margherita.save();
    console.log("🍕 Pizza Margherita added!");

    process.exit();
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
