import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import CategoryPills from "./components/CategoryPills";
import Section from "./components/Section";
import "./index.css";

export default function App() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState("Beliebt");

  useEffect(() => {
    api.get("/api/items").then((r) => setItems(r.data));
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

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <div className="flex-1 bg-amber-200">
        <Hero />

        <div className="max-w-5xl mx-auto px-3 py-6">
          <h2 className="text-3xl font-bold">BellaBiladi</h2>
          <CategoryPills tabs={categories} active={active} onPick={setActive} />

          {/* Render grouped sections */}
          {[...grouped.entries()].map(([cat, list]) => (
            <Section key={cat} title={cat} items={list} />
          ))}
        </div>

        {/* Footer */}
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
