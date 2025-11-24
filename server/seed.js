import mongoose from "mongoose";
import dotenv from "dotenv";
import Item from "./src/models/Item.js";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/bb";

const items = [
  // ---------- BELIEBTE ----------
  {
    name: "Beliebte Pizzabrötchen mit Käse",
    description:
      "8 Stück mit Dip zur Wahl: vegane Mayo, BBQ, Knoblauch, Kräuter oder Sweet-Chili.",
    priceCents: 1000,
    category: "Popular",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Veggie-BBQ-Pizza",
    description:
      "BBQ-Sauce, Veggie-Pulled, Brokkoli, Cherrytomaten und rote Zwiebeln.",
    priceCents: 1000,
    category: "Popular",
    imageUrl: "/veggie-bbq.jpeg",
  },
  {
    name: "Pizza Caprese",
    description: "Frische Tomaten, Mozzarella und Basilikum.",
    priceCents: 900,
    category: "Popular",
    imageUrl: "/caprese.jpeg",
  },
  {
    name: "Pizza Hot Biladi",
    description: "Rindersalami, rote Zwiebeln und frische Chili.",
    priceCents: 1000,
    category: "Popular",
    imageUrl: "/hot-biladi.jpeg",
  },
  {
    name: "Pizza Di Casa",
    description: "Sauce Hollandaise, Puten-Schinken und Brokkoli.",
    priceCents: 900,
    category: "Popular",
    imageUrl: "/di-casa.jpeg",
  },

  // ---------- PIZZA ----------
  {
    name: "Pizza Margherita",
    description: "Klassische Tomatensauce und Käse.",
    priceCents: 600,
    category: "Pizza",
    imageUrl: "/margherita.jpeg",
  },
  {
    name: "Pizza Funghi",
    description: "Tomatensauce, Käsemix und Champignons.",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/funghi.jpeg",
  },
  {
    name: "Pizza Coppola",
    description: "Tomatensauce, Käse und Zwiebeln.",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/capricciosa.jpeg",
  },
  {
    name: "Pizza Brokkoli",
    description: "Sauce Hollandaise und Brokkoli.",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/brokkoli.jpeg",
  },
  {
    name: "Pizza Zaytouna",
    description: "Mit frischen Oliven.",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/veganita.jpeg",
  },
  {
    name: "Pizza Artischocke",
    description: "Mit frischen Artischocken.",
    priceCents: 700,
    category: "Pizza",
    imageUrl: "/artischoken.jpeg",
  },
  {
    name: "Pizza Vier Jahreszeiten",
    description:
      "Champignons, Oliven und Artischocken – der vegetarische Klassiker.",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/4 - stagioni.jpeg",
  },
  {
    name: "Pizza Mozza",
    description: "Tomatensauce, Basilikum und Mozzarella.",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/mozza.jpeg",
  },
  {
    name: "Pizza Veggie Pulled",
    description: "Belegt mit würzigem Veggie-Pulled-Gemüse.",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/Veggie pulled.jpeg",
  },
  {
    name: "Pizza Veganita",
    description: "Frische Tomaten, Spinat und Oliven.",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/veganita.jpeg",
  },
  {
    name: "Pizza Melanzane",
    description: "Paprika, Auberginen und Cherrytomaten.",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/melanzane.jpeg",
  },
  {
    name: "Pizza Deluxe",
    description: "Frische Tomaten, Brokkoli, Champignons und Auberginen.",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/deluxe.jpeg",
  },
  {
    name: "Pizza Veggie Lovers",
    description: "Veggie-Pulled, Paprika und Mais.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/veggie-bbq.jpeg",
  },
  {
    name: "Pizza Happy Garden",
    description: "Brokkoli, Spinat, Paprika, Oliven und Cherrytomaten.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/happy garden.jpeg",
  },
  {
    name: "Pizza Sei Formaggi",
    description: "Mit Brie, Gorgonzola und Mozzarella.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/6 - formaggi.jpeg",
  },
  {
    name: "Calzone Veggie",
    description: "Veggie-Pulled, Champignons und Spinat.",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/calzone.jpeg",
  },
  {
    name: "Calzone Gorgonzola",
    description: "Champignons, Gorgonzola und Artischocken als Calzone.",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/gorgon.jpeg",
  },
  {
    name: "Pizza Salami",
    description: "Tomatensauce, Käse und Rindersalami.",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/salami.jpeg",
  },
  {
    name: "Pizza Prosciutto",
    description: "Tomatensauce, Käse und Puten-Schinken.",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/prosciutto.jpeg",
  },
  {
    name: "Pizza Prosciutto e Funghi",
    description:
      "Tomatensauce, Käsemix, frische Champignons und zarter Puten-Schinken.",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/prosciutto e funghi.jpeg",
  },
  {
    name: "Pizza Bolognese",
    description: "Tomatensauce, Käse und Rinderhack.",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/bolognaise.jpeg",
  },
  {
    name: "Pizza Pollo",
    description: "Sauce Hollandaise, Käse und Hähnchenbrust.",
    priceCents: 750,
    category: "Pizza",
    imageUrl: "/pollo.jpeg",
  },
  {
    name: "Pizza Hawaii",
    description: "Ananas und Puten-Schinken.",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/hawaii.jpeg",
  },
  {
    name: "Pizza Salami e Funghi",
    description: "Champignons und Rindersalami.",
    priceCents: 900,
    category: "Pizza",
    imageUrl: "/salami et funghi.jpeg",
  },
  {
    name: "Pizza Napoli",
    description: "Sardellen, Kapern und Oliven.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/napoli.jpeg",
  },
  {
    name: "Pizza Biladi",
    description: "Hähnchenbrust, Brokkoli und Mais.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/biladi.jpeg",
  },
  {
    name: "Pizza Bella Biladi",
    description: "Rinderhack, rote Zwiebeln und frische Tomaten.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/bella-biladi.jpeg",
  },
  {
    name: "Pizza Sucuk",
    description: "Sucuk und Paprika.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/suzuk.jpeg",
  },
  {
    name: "Pizza Le Gamila",
    description: "Rinderhack, Paprika und Artischocken.",
    priceCents: 1000,
    category: "Pizza",
    imageUrl: "/le-gamila.jpeg",
  },
  {
    name: "Pizza Capricciosa",
    description: "Puten-Schinken, Champignons, Oliven und Artischocken.",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/capricciosa.jpeg",
  },
  {
    name: "Pizza Metzger",
    description: "Rindersalami, Puten-Schinken und Rinderhack.",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/metzger.jpeg",
  },
  {
    name: "Pizza Salami Supreme",
    description: "Extra Käse und doppelte Rindersalami.",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/supreme.jpeg",
  },
  {
    name: "Pizza BBQ",
    description: "BBQ-Sauce, Rindersalami, Sucuk und Aubergine.",
    priceCents: 1100,
    category: "Pizza",
    imageUrl: "/bbq.jpeg",
  },
  {
    name: "Calzone Klassisch",
    description: "Champignons und Puten-Schinken.",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/calzone.jpeg",
  },
  {
    name: "Calzone Popeye",
    description: "Hähnchenbrust, Spinat und frisches Basilikum.",
    priceCents: 1200,
    category: "Pizza",
    imageUrl: "/calzone.jpeg",
  },

  // ---------- PIZZABRÖTCHEN ----------
  {
    name: "Pizzabrötchen ohne Füllung",
    description:
      "8 Stück mit Dip zur Wahl: vegane Mayo, BBQ, Knoblauch, Kräuter oder Sweet-Chili.",
    priceCents: 450,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizzabrötchen mit Käse",
    description: "8 Stück mit Dip nach Wahl.",
    priceCents: 500,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizzabrötchen mit Käse & Rindersalami",
    description: "8 Stück mit Dip nach Wahl.",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizzabrötchen mit Käse & Puten-Schinken",
    description: "8 Stück mit Dip nach Wahl.",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizzabrötchen mit Käse & Thunfisch",
    description: "8 Stück mit Dip nach Wahl.",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizzabrötchen mit Käse & Oliven",
    description: "8 Stück mit Dip nach Wahl.",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizzabrötchen mit Käse & Champignons",
    description: "8 Stück mit Dip nach Wahl.",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },
  {
    name: "Pizzabrötchen mit Käse & Spinat",
    description:
      "Auf Wunsch mit veganem Käse. 8 Stück mit Dip nach Wahl.",
    priceCents: 550,
    category: "Pizza rolls",
    imageUrl: "/pizzabroetchen.jpeg",
  },

  // ---------- SALATE & ANTIPASTI ----------
  {
    name: "Bruschetta",
    description: "Hausgemachtes Brot mit Tomaten, Zwiebeln und Knoblauch. Vegan.",
    priceCents: 600,
    category: "Salads",
    imageUrl: "/bruschetta.jpg",
  },
  {
    name: "Tomaten & Mozzarellascheiben",
    description: "Frische Tomaten und Mozzarella mit Basilikum. Veggie.",
    priceCents: 700,
    category: "Salads",
    imageUrl: "/tomaten-mozzerella.webp",
  },
  {
    name: "Antipasti",
    description: "Gegrilltes Gemüse, vegan.",
    priceCents: 800,
    category: "Salads",
    imageUrl: "/antipasti.jpg",
  },
  {
    name: "Caesar Salad",
    description: "Salat, Croutons, Parmesan, Dressing & Hähnchen – auf Wunsch vegan.",
    priceCents: 800,
    category: "Salads",
    imageUrl: "/caesar-salad.jpg",
  },

  // ---------- FINGERFOOD ----------
  {
    name: "Chicken Wings",
    description: "6 Stück inklusive Dip.",
    priceCents: 750,
    category: "Fingerfood",
    imageUrl: "/ChickenWings.jpg",
  },
  {
    name: "Chicken Nuggets",
    description: "9 Stück inklusive Dip.",
    priceCents: 750,
    category: "Fingerfood",
    imageUrl: "/Chicken-Nuggets.jpg",
  },
  {
    name: "Mozzarella Sticks",
    description: "6 Stück inklusive Dip. Veggie.",
    priceCents: 650,
    category: "Fingerfood",
    imageUrl: "/Mozzarella-Sticks.jpeg",
  },
  {
    name: "Snack Box",
    description: "3x Wings, 3x Nuggets, 4x Mozzarella Sticks inklusive Dip.",
    priceCents: 1000,
    category: "Fingerfood",
    imageUrl: "/snack-box.avif",
  },

  // ---------- SPAGHETTI ----------
  {
    name: "Spaghetti Napoli",
    description: "Tomatensauce, Knoblauch, Basilikum und Olivenöl (vegan).",
    priceCents: 800,
    category: "Spaghetti",
    imageUrl: "/spaghetti.jpeg",
  },
  {
    name: "Spaghetti Aglio e Olio",
    description: "Knoblauch, Chili, Olivenöl und Petersilie (vegan).",
    priceCents: 800,
    category: "Spaghetti",
    imageUrl: "/spaghetti.jpeg",
  },
  {
    name: "Spaghetti Bolognese",
    description: "Rinderhack, Zwiebeln, Tomatensauce und Knoblauch.",
    priceCents: 950,
    category: "Spaghetti",
    imageUrl: "/spaghetti.jpeg",
  },
  {
    name: "Spaghetti Carbonara",
    description: "Sahnesauce, Rinderbacon, Ei, Parmesan und Pfeffer.",
    priceCents: 950,
    category: "Spaghetti",
    imageUrl: "/spaghetti.jpeg",
  },

  // ---------- PASTA ÜBERBACKEN ----------
  {
    name: "Pollo al Forno",
    description: "Sahnesauce, Brokkoli, Hähnchenbrust und Pesto.",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/Pasta-ueberbacken.jpeg",
  },
  {
    name: "Gemüse al Forno",
    description: "Sahnesauce, Champignons, Spinat, Cherrytomaten und Pesto.",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/Pasta-ueberbacken.jpeg",
  },
  {
    name: "Vegaforno",
    description: "Vegane Sahnesauce, Spinat, Champignons, Mais und veganer Käse.",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/Pasta-ueberbacken.jpeg",
  },
  {
    name: "Bolognese al Forno",
    description: "Tomatensauce, Parmesan und Rinderhack.",
    priceCents: 950,
    category: "Baked Pasta",
    imageUrl: "/Pasta-ueberbacken.jpeg",
  },

  // ---------- BURGER ----------
  {
    name: "Cheeseburger",
    description: "Saftiger Rindfleischburger mit Käse.",
    priceCents: 990,
    category: "Burger",
    imageUrl: "/burger.jpeg",
  },
  {
    name: "Chickenburger",
    description: "Knuspriges Hähnchenfilet im Burger.",
    priceCents: 990,
    category: "Burger",
    imageUrl: "/burger.jpeg",
  },
  {
    name: "Vegan Burger",
    description: "Pflanzlicher Patty mit frischem Gemüse.",
    priceCents: 990,
    category: "Burger",
    imageUrl: "/burger.jpeg",
  },

  // ---------- POMMES FRITES ----------
  {
    name: "Pommes Frites (kleine Portion)",
    description: "Mit Ketchup oder Mayo inklusive.",
    priceCents: 400,
    category: "French fries",
    imageUrl: "/pommes.jpeg",
  },
  {
    name: "Pommes Frites (große Portion)",
    description: "Mit Ketchup oder Mayo inklusive.",
    priceCents: 600,
    category: "French fries",
    imageUrl: "/pommes.jpeg",
  },

  // ---------- GETRÄNKE ----------
  {
    name: "Fritz Kola Original",
    description: "Die klassische Kola mit 25 mg/100 ml Koffein.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/fritz-kola-original.webp",
  },
  {
    name: "Fritz Kola Classic Light",
    description: "Die leichte Variante mit 25 mg/100 ml Koffein.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/fritz-kola-classic-light.webp",
  },
  {
    name: "Fritz Kola Super Zero",
    description: "Zero Zucker, 25 mg/100 ml Koffein.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/fritz-kola-super-zero.webp",
  },
  {
    name: "Fritz Limo Zitrone",
    description: "Zitronige Limonade mit 7% Fruchtanteil.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/fritz-limo-zitrone.webp",
  },
  {
    name: "Fritz Limo Honigmelone",
    description: "Süße Limonade mit 5% Fruchtanteil.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/fritz-limo-honigmelone.webp",
  },
  {
    name: "Fritz Limo Orange",
    description: "Orangige Limonade mit 17% Fruchtanteil.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/fritz-limo-orange.webp",
  },
  {
    name: "Fritz Anjola Ananas Limette",
    description: "fritz Anjola Ananas Limette Bio.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/anjola.png",
  },
  {
    name: "Fritz Mischmasch Kola + Orange",
    description: "Die perfekte Mischung aus Kola und Orange.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/mischmasch.png",
  },
  {
    name: "Club Mate",
    description: "Erfrischendes Mate-Getränk mit natürlichem Koffein.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/club-mate.webp",
  },
  {
    name: "Ayran",
    description: "Erfrischendes türkisches Joghurtgetränk.",
    priceCents: 200,
    category: "drinks",
    imageUrl: "/ayran.png",
  },
  {
    name: "Fuze Tea Pfirsich",
    description: "Schwarzer Tee mit Pfirsichgeschmack.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/Fuze_Tea_Pfirsich.png",
  },
  {
    name: "Fuze Tea Zitrone",
    description: "Schwarzer Tee mit Zitronengeschmack.",
    priceCents: 350,
    category: "drinks",
    imageUrl: "/Fuze_Tea_Zitrone.png",
  },
  {
    name: "Wasser",
    description: "Erfrischendes Mineralwasser.",
    priceCents: 200,
    category: "drinks",
    imageUrl: "/wasser.png",
  },
  {
    name: "Sprudelwasser",
    description: "Erfrischendes Sprudelwasser.",
    priceCents: 200,
    category: "drinks",
    imageUrl: "/sprudelwasser.png",
  },

  // ---------- DESSERTS ----------
  {
    name: "Tiramisu",
    description: "Klassisches italienisches Dessert mit Kaffee und Mascarpone.",
    priceCents: 450,
    category: "Desserts",
    imageUrl: "/tiramisu.webp",
  },
  {
    name: "3 Stk baqlawa",
    description: "Süßes Gebäck aus Blätterteig mit Honig und Nüssen.",
    priceCents: 400,
    category: "Desserts",
    imageUrl: "/Baklava.jpg",
  },
  {
    name: "Kuchen",
    description: "Hausgemachter Kuchen.",
    priceCents: 450,
    category: "Desserts",
    imageUrl: "/cake.jpg",
  },
];

(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    await Item.deleteMany({});
    console.log("🗑️ Old items cleared");

    // Add order field to each item based on its position in the array
    const itemsWithOrder = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    await Item.insertMany(itemsWithOrder);
    console.log(`🍕 Inserted ${items.length} items successfully!`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
})();
