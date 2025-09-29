import mongoose from "mongoose";
import dotenv from "dotenv";
import Item from "./src/models/Item.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/bb";

const items = [
  // 🔹 Beliebt
  {
    name: "Veggie BBQ",
    description:
      "Sauce, Veggie pulled, rote Zwiebeln, Brokkoli und cherry Tomaten",
    priceCents: 1000,
    category: "Beliebt",
    imageUrl: "/veggie-bbq.jpeg",
  },
  {
    name: "Pizzabrötchen Käse",
    description:
      "Mit Käse, Salami, Schinken oder Oliven – jeweils 8 Stück & Dip",
    priceCents: 550,
    category: "Beliebt",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza Caprese",
    description: "frische Tomaten, Mozzarella und frisches Basilikum",
    priceCents: 900,
    category: "Beliebt",
    imageUrl: "/caprese.jpeg",
  },
  {
    name: "Hot Biladi",
    description: "Rindersalami, rote Zwiebeln und frische Chilli",
    priceCents: 1000,
    category: "Beliebt",
    imageUrl: "/hot-biladi.jpeg",
  },
  {
    name: "Di Casa",
    description: "Sauce Hollandaise, Putenschinken und Brokkoli",
    priceCents: 900,
    category: "Beliebt",
    imageUrl: "/di-casa.jpeg",
  },

  // 🔹 Pizza
  {
    name: "Pizza Margherita",
    description: "Klassische Pizza mit Tomaten und Käse",
    priceCents: 640,
    category: "Pizza",
    imageUrl: "/margherita.jpeg",
  },
  {
    name: "Pizza Biladi",
    description: "Unsere Spezialität mit frischem Gemüse",
    priceCents: 799,
    category: "Pizza",
    imageUrl: "/biladi.jpeg",
  },

  // 🔹 Pizzabrötchen
  {
    name: "Pizzabrötchen Käse",
    description: "Es werden jeweils 8 Stück und einem Dip Ihrer Wahl serviert",
    priceCents: 640,
    category: "Pizzabrötchen",
    imageUrl: "/pizzabroetchen.jpeg",
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
