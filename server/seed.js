import mongoose from "mongoose";
import dotenv from "dotenv";
import Item from "./src/models/Item.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/bb";

const items = [
  {
    name: "Pizza Biladi",
    description: "Unsere Spezialität mit frischem Gemüse",
    priceCents: 799,
    category: "Pizza",
    imageUrl: "/margherita.jpeg",
  },
  {
    name: "Pizzabrötchen Käse",
    description: "Es werden jeweils 8 Stück und einem Dip Ihrer Wahl serviert",
    priceCents: 640,
    category: "Pizzabrötchen",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Tajin",
    description: "Pasta mit Käse",
    priceCents: 930,
    category: "Beliebt",
    imageUrl: "/tajin.jpeg",
  },
];

(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    await Item.deleteMany({});
    console.log("🗑️ Old items cleared");

    await Item.insertMany(items);
    console.log("🍕 Items seeded successfully!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
})();
