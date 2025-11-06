import mongoose from "mongoose";
import dotenv from "dotenv";
import Item from "./src/models/Item.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/bb";

const items = [
  // ---------- POPULAR ----------
  {
    name: "Veggie BBQ",
    description:
      "BBQ sauce, pulled veggie, broccoli, cherry tomatoes and red onions",
    priceCents: 1000,
    category: "Popular",
    imageUrl: "/veggie-bbq.jpeg",
  },
  {
    name: "Pizza rolls cheese",
    description:
      "8 pieces each with dip: vegan mayo, BBQ, garlic, herbs or sweet chili.",
    priceCents: 550,
    category: "Popular",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza Caprese",
    description: "Fresh tomatoes, mozzarella and fresh basil",
    priceCents: 900,
    category: "Popular",
    imageUrl: "/caprese.jpeg",
  },
  {
    name: "Hot Biladi",
    description: "Beef salami, red onions and fresh chili",
    priceCents: 1000,
    category: "Popular",
    imageUrl: "/hot-biladi.jpeg",
  },
  {
    name: "Di Casa",
    description: "Hollandaise sauce, turkey ham and broccoli",
    priceCents: 900,
    category: "Popular",
    imageUrl: "/di-casa.jpeg",
  },

  // ---------- PIZZA ----------
  {
    name: "Pizza Margherita",
    description: "Classic pizza with tomatoes and cheese",
    priceCents: 600,
    category: "Pizza",
    imageUrl: "/margherita.jpeg",
  },
  {
    name: "Pizza Funghi",
    description: "Tomato sauce, cheese mix and mushrooms",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/funghi.jpeg",
  },
  {
    name: "Pizza Coppola",
    description: "Tomato sauce, cheese and onions",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/capricciosa.jpeg",
  },
  {
    name: "Broccoli pizza",
    description: "Hollandaise sauce and broccoli",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/brokkoli.jpeg",
  },
  {
    name: "Pizza Zaytouna",
    description: "With fresh olives",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/veganita.jpeg",
  },
  {
    name: "Artichoke pizza",
    description: "With fresh artichokes",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/artischoken.jpeg",
  },
  {
    name: "Pizza 4 Stagioni",
    description:
      "With mushrooms, olives and artichokes – a classic vegetarian dish",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/4 - stagioni.jpeg",
  },
  {
    name: "Mozza",
    description: "Tomato sauce, basil and mozzarella",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/mozza.jpeg",
  },
  {
    name: "Veggie Pulled Pizza",
    description: "Topped with pulled vegetables, juicy and spicy",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/Veggie pulled.jpeg",
  },
  {
    name: "Veganita Pizza",
    description: "Fresh tomatoes, spinach and olives",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/veganita.jpeg",
  },
  {
    name: "Melanzane",
    description: "Peppers, eggplants and cherry tomatoes",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/melanzane.jpeg",
  },
  {
    name: "Pizza Deluxe",
    description: "Fresh tomatoes, broccoli, mushrooms and eggplants",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/deluxe.jpeg",
  },
  {
    name: "Veggie Lovers",
    description: "Veggie pulled, peppers and corn",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/veggie-bbq.jpeg",
  },
  {
    name: "Happy Garden",
    description: "Broccoli, spinach, bell peppers, olives and cherry tomatoes",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/happy garden.jpeg",
  },
  {
    name: "6 Formaggi",
    description: "With Brie, Gorgonzola and Mozzarella",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/6 - formaggi.jpeg",
  },
  {
    name: "Veggie Calzone",
    description: "Veggie pulled, mushrooms and spinach",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/calzone.jpeg",
  },
  {
    name: "Gorgon Zone",
    description: "Mushrooms, Gorgonzola, artichokes as a calzone",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/gorgon.jpeg",
  },
  {
    name: "Pizza Salami",
    description: "Tomato sauce, cheese and salami",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/salami.jpeg",
  },
  {
    name: "Prosciutto",
    description: "Tomato sauce, cheese and turkey ham",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/prosciutto.jpeg",
  },
  {
    name: "Prosciutto e Funghi",
    description:
      "Tomato sauce, cheese mix, fresh mushrooms and tender turkey ham",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/prosciutto e funghi.jpeg",
  },
  {
    name: "Bolognese",
    description: "Tomato sauce, cheese and ground beef",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/bolognaise.jpeg",
  },
  {
    name: "Pollo",
    description: "Hollandaise sauce, cheese and chicken breast",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/pollo.jpeg",
  },
  {
    name: "Hawaii",
    description: "Pineapple and turkey ham",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/hawaii.jpeg",
  },
  {
    name: "Salami et Funghi",
    description: "Mushrooms and beef salami",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/salami et funghi.jpeg",
  },
  {
    name: "Napoli",
    description: "Sardines, capers and olives",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/napoli.jpeg",
  },
  {
    name: "Biladi",
    description: "Chicken breast, broccoli and corn",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/biladi.jpeg",
  },
  {
    name: "Bella Biladi",
    description: "Ground beef, red onions and fresh tomatoes",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/bella-biladi.jpeg",
  },
  {
    name: "Suzuk",
    description: "With sucuk and peppers",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/suzuk.jpeg",
  },
  {
    name: "Le Gamila",
    description: "Ground beef, bell peppers and artichokes",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/le-gamila.jpeg",
  },
  {
    name: "Capricciosa",
    description: "Turkey ham, mushrooms, olives and artichokes",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/capricciosa.jpeg",
  },
  {
    name: "Butcher",
    description: "Beef salami, turkey ham and minced beef",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/metzger.jpeg",
  },
  {
    name: "Salami Supreme",
    description: "Double cheese and double beef salami",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/supreme.jpeg",
  },
  {
    name: "BBQ",
    description: "BBQ sauce, beef salami, sucuk and aubergine",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/bbq.jpeg",
  },
  {
    name: "Classic Calzone",
    description: "Mushrooms and turkey ham",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/calzone.jpeg",
  },
  {
    name: "Popeye Calzone",
    description: "Chicken breast, spinach and fresh basil",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/calzone.jpeg",
  },

  // ---------- PIZZA ROLLS ----------
  {
    name: "Unfilled pizza rolls",
    description:
      "8 pieces each with dip: vegan mayo, BBQ, garlic, herbs or sweet chili",
    priceCents: 450,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza rolls with cheese",
    description: "8 pieces each with dip",
    priceCents: 500,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza rolls with cheese & beef salami",
    description: "8 pieces each with dip",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza rolls with cheese & turkey ham",
    description: "8 pieces each with dip",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza rolls with cheese & tuna",
    description: "8 pieces each with dip",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza rolls with cheese & olives",
    description: "8 pieces each with dip",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza rolls with cheese & mushrooms",
    description: "8 pieces each with dip",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizza rolls with cheese & spinach",
    description:
      "Available with vegan cheese upon request. 8 pieces each with dip.",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },

  // ---------- SPAGHETTI ----------
  {
    name: "Spaghetti Napoli",
    description: "Tomato sauce, garlic, basil & olive oil (vegan)",
    priceCents: 800,
    category: "Spaghetti",
    imageUrl: "/spaghetti-napoli.webp",
  },
  {
    name: "Spaghetti Aglio e Olio",
    description: "Garlic, chili, olive oil & parsley (vegan)",
    priceCents: 800,
    category: "Spaghetti",
    imageUrl: "/Spaghetti Aglio e Olio.avif",
  },
  {
    name: "Spaghetti Bolognese",
    description: "Ground beef, onions, tomato sauce & garlic",
    priceCents: 950,
    category: "Spaghetti",
    imageUrl: "/Spaghetti Bolognese.jpg",
  },
  {
    name: "Spaghetti Carbonara",
    description: "Cream sauce, beef bacon, egg, parmesan & pepper",
    priceCents: 950,
    category: "Spaghetti",
    imageUrl: "/Spaghetti Carbonara.avif",
  },

  // ---------- BAKED PASTA ----------
  {
    name: "Pollo al Forno",
    description: "Cream sauce, broccoli, chicken breast & pesto",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/pasta-ueberbacken.jpg",
  },
  {
    name: "Foraged Vegetables",
    description: "Cream sauce, mushrooms, spinach, cherry tomatoes & pesto",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/pasta-ueberbacken.jpg",
  },
  {
    name: "Vegaforno",
    description: "Vegan cream sauce, spinach, mushrooms, corn & vegan cheese",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/pasta-ueberbacken.jpg",
  },
  {
    name: "Bolognese al Forno",
    description: "Tomato sauce, Parmesan cheese & ground beef",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/pasta-ueberbacken.jpg",
  },
];

(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    await Item.deleteMany({});
    console.log("🗑️ Old items cleared");

    await Item.insertMany(items);
    console.log(`🍕 Inserted ${items.length} items successfully!`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
})();
