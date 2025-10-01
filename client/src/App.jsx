import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import CategoryPills from "./components/CategoryPills";
import Section from "./components/Section";
import "./index.css";

export default function App() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState("Beliebt");
  const [cart, setCart] = useState([]); // 🛒 Cart state
  const sectionRefs = useRef({});

  useEffect(() => {
    api
      .get("/api/items")
      .then((r) => setItems(r.data))
      .catch((err) => console.warn("⚠️ Backend not ready:", err.message));
  }, []);

  const categories = useMemo(() => {
    const defaults = ["Beliebt", "Pizza", "Pizzabrötchen"];
    const dynamic = items.map((i) => i.category || "Pizza");
    return [...new Set([...defaults, ...dynamic])];
  }, [items]);

  const grouped = useMemo(() => {
    const m = new Map();
    items.forEach((i) => {
      const k = i.category || "Pizza";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(i);
    });
    return m;
  }, [items]);

  // Scroll effect
  useEffect(() => {
    if (sectionRefs.current[active]) {
      sectionRefs.current[active].scrollIntoView({ behavior: "smooth" });
    }
  }, [active]);

  // Add to cart handler
  const handleAddToCart = (item) => {
    setCart((prev) => [...prev, item]);
    console.log("🛒 Cart:", [...cart, item]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 bg-amber-200">
        <Hero />
        <div className="max-w-5xl mx-auto px-3 py-6">
          <h2 className="text-3xl font-bold">BellaBiladi</h2>
          <CategoryPills tabs={categories} active={active} onPick={setActive} />

          {/* Force Beliebt first */}
          {grouped.get("Beliebt") && (
            <Section
              key="Beliebt"
              title="Beliebt"
              items={grouped.get("Beliebt")}
              ref={(el) => (sectionRefs.current["Beliebt"] = el)}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* Force Pizza second */}
          {grouped.get("Pizza") && (
            <Section
              key="Pizza"
              title="Pizza"
              items={grouped.get("Pizza")}
              ref={(el) => (sectionRefs.current["Pizza"] = el)}
              onAddToCart={handleAddToCart}
            />
          )}

          {/* Render the rest */}
          {[...grouped.entries()]
            .filter(([cat]) => cat !== "Beliebt" && cat !== "Pizza")
            .map(([cat, list]) => (
              <Section
                key={cat}
                title={cat}
                items={list}
                ref={(el) => (sectionRefs.current[cat] = el)}
                onAddToCart={handleAddToCart}
              />
            ))}
        </div>

        {/* Simple cart debug */}
        <div className="bg-white p-4">
          <h3 className="font-bold">Cart</h3>
          {cart.map((item, idx) => (
            <div key={idx}>
              {item.name} – {item.priceCents / 100}€
            </div>
          ))}
        </div>

        <footer className="mt-6 py-6 text-xs text-slate-700 bg-amber-200">
          <div className="max-w-5xl mx-auto px-3">
            <div className="flex gap-3 mb-3">
              <a href="#">X</a>
              <a href="#">IG</a>
              <a href="#">FB</a>
            </div>
            <div>
              <div className="font-medium">Impressum</div>
              <div>Bella Biladi</div>
              <div>Eisdorferstr. 2</div>
              <div>04115 Leipzig</div>
              <div>Vertretungsberechtigt: Khalil Mounirhi</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
