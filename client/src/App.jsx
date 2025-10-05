import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import CategoryPills from "./components/CategoryPills";
import Section from "./components/Section";
import { CartProvider, useCart } from "./pages/CartContext";
import { AuthProvider } from "./pages/AuthContext";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./index.css";

function MainApp() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState("Beliebt");
  const [page, setPage] = useState(
    localStorage.getItem("currentPage") || "Home"
  );
  const { addToCart } = useCart();
  const sectionRefs = useRef({});

  // ✅ Persist current page and update URL
  useEffect(() => {
    localStorage.setItem("currentPage", page);
    window.history.pushState({}, "", `/${page.toLowerCase()}`);
  }, [page]);

  // ✅ Fetch menu items
  useEffect(() => {
    api
      .get("/api/items")
      .then((r) => setItems(r.data))
      .catch((err) => console.warn("⚠️ Backend not ready:", err.message));
  }, []);

  // ✅ Build category list
  const categories = useMemo(() => {
    const defaults = ["Beliebt", "Pizza", "Pizzabrötchen"];
    const dynamic = items.map((i) => i.category || "Pizza");
    return [...new Set([...defaults, ...dynamic])];
  }, [items]);

  // ✅ Group items by category
  const grouped = useMemo(() => {
    const m = new Map();
    items.forEach((i) => {
      const k = i.category || "Pizza";
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(i);
    });
    return m;
  }, [items]);

  // ✅ Scroll to active section
  useEffect(() => {
    if (sectionRefs.current[active]) {
      sectionRefs.current[active].scrollIntoView({ behavior: "smooth" });
    }
  }, [active]);

  // ✅ Page rendering logic
  return (
    <div className="flex flex-col min-h-screen">
      {/* Always show navbar */}
      <NavBar activePage={page} onNavigate={setPage} />

      <main className="flex-1">
        {page === "Home" && (
          <div className="bg-amber-200">
            <Hero />
            <div className="max-w-5xl mx-auto px-3 py-6">
              <h2 className="text-3xl font-bold mb-4">BellaBiladi</h2>
              <CategoryPills
                tabs={categories}
                active={active}
                onPick={setActive}
              />

              {grouped.get("Beliebt") && (
                <Section
                  key="Beliebt"
                  title="Beliebt"
                  items={grouped.get("Beliebt")}
                  ref={(el) => (sectionRefs.current["Beliebt"] = el)}
                  onAddToCart={addToCart}
                />
              )}

              {grouped.get("Pizza") && (
                <Section
                  key="Pizza"
                  title="Pizza"
                  items={grouped.get("Pizza")}
                  ref={(el) => (sectionRefs.current["Pizza"] = el)}
                  onAddToCart={addToCart}
                />
              )}

              {[...grouped.entries()]
                .filter(([cat]) => cat !== "Beliebt" && cat !== "Pizza")
                .map(([cat, list]) => (
                  <Section
                    key={cat}
                    title={cat}
                    items={list}
                    ref={(el) => (sectionRefs.current[cat] = el)}
                    onAddToCart={addToCart}
                  />
                ))}
            </div>
          </div>
        )}

        {page === "Cart" && <Cart onNavigate={setPage} />}
        {page === "Checkout" && <Checkout />}
        {page === "Login" && <Login onNavigate={setPage} />}
        {page === "Register" && <Register onNavigate={setPage} />}
      </main>

      {/* ✅ Hide footer on auth pages */}
      {page !== "Login" && page !== "Register" && (
        <footer
          className={`py-6 text-xs text-slate-700 ${
            page === "Cart" || page === "Checkout"
              ? "bg-white border-t"
              : "bg-amber-200"
          }`}
        >
          <div className="max-w-5xl mx-auto px-3">
            <div className="flex gap-3 mb-3">
              <a href="#">X</a>
              <a href="#">IG</a>
              <a href="#">FB</a>
            </div>
            <div>
              <div className="font-medium">Impressum</div>
              <div>Bella Biladi</div>
              <div>Edlichstraße 2</div>
              <div>04315 Leipzig</div>
              <div>Vertretungsberechtigt: Khalil Mountahi</div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}
