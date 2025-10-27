import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import CategoryPills from "./components/CategoryPills";
import Section from "./components/Section";
import { CartProvider, useCart } from "./pages/CartContext";
import { AuthProvider, useAuth } from "./pages/AuthContext";
import CheckoutPayment from "./pages/CheckoutPayment";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import "./index.css";

function MainApp() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState("Beliebt");
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("currentPage");
    if (saved) return saved;
    const path = window.location.pathname.replace(/^\//, "");
    const map = {
      "": "Home",
      home: "Home",
      warenkorb: "Cart",
      kasse: "Checkout",
      checkout: "Checkout",
      login: "CheckoutLogin",
      register: "CheckoutRegister",
      orders: "Orders",
      profile: "Profile",
      admin: "Admin",
    };
    return map[path] || "Home";
  });
  const { addToCart } = useCart();
  const { user, loading } = useAuth();
  const sectionRefs = useRef({});

  // 🧭 Sync URL + localStorage
  useEffect(() => {
    localStorage.setItem("currentPage", page);
    const map = {
      Home: "/home",
      Cart: "/warenkorb",
      Checkout: "/kasse",
      CheckoutLogin: "/login",
      CheckoutRegister: "/register",
      CheckoutPayment: "/checkout",
      Orders: "/orders",
      Profile: "/profile",
      Admin: "/admin",
    };
    const path = map[page] || "/home";
    window.history.pushState({}, "", path);
  }, [page]);

  // 🍕 Fetch menu items
  useEffect(() => {
    api
      .get("/api/items")
      .then((r) => setItems(r.data))
      .catch((err) => console.warn("⚠️ Backend not ready:", err.message));
  }, []);

  // 🗂️ Build categories
  const categories = useMemo(() => {
    const defaults = [
      "Beliebt",
      "Pizza",
      "Pizzabrötchen",
      "Spaghetti",
      "Pasta Überbacken",
      "Burger",
      "Pommes Frites",
      "Getränke",
      "Desserts",
    ];
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

  // 📜 Smooth scroll when switching tabs
  useEffect(() => {
    if (sectionRefs.current[active]) {
      sectionRefs.current[active].scrollIntoView({ behavior: "smooth" });
    }
  }, [active]);

  // 🎨 UI visibility logic
  const hideNav =
    page === "Checkout" ||
    page === "CheckoutLogin" ||
    page === "CheckoutRegister";

  const hideFooter =
    page === "Checkout" ||
    page === "CheckoutLogin" ||
    page === "CheckoutRegister" ||
    page === "Cart";

  // 🧭 Universal navigation handler
  const handleNavigate = (newPage) => {
    // 🔐 Require login for certain routes
    const protectedPages = [
      "CheckoutPayment",
      "Checkout",
      "CheckoutRegister",
      "CheckoutLogin",
      "Orders",
      "Profile",
    ];

    if (protectedPages.includes(newPage) && !user) {
      localStorage.setItem("redirectAfterLogin", newPage);
      setPage("CheckoutLogin");
      return;
    }

    // ✅ update page normally
    setPage(newPage);
  };

  // 🧭 Redirect after login/register automatically
  useEffect(() => {
    const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");

    // if user just logged in and a redirect target exists
    if (user && redirectAfterLogin) {
      setTimeout(() => {
        setPage(redirectAfterLogin);
        localStorage.removeItem("redirectAfterLogin");
      }, 500); // small delay to ensure AuthContext is ready
    }
  }, [user]);

  // ⏳ Loading auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-amber-200">
        <div className="text-lg font-semibold text-gray-700">
          Benutzerstatus wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 🧭 Navigation */}
      {!hideNav && <NavBar activePage={page} onNavigate={handleNavigate} />}

      <main
        className={`flex-1 ${
          page === "Cart"
            ? "bg-amber-200 flex justify-center items-center overflow-hidden"
            : ""
        }`}
      >
        {/* 🏠 HOME */}
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

              {/* Featured */}
              {grouped.get("Beliebt") && (
                <Section
                  key="Beliebt"
                  title="Beliebt"
                  items={grouped.get("Beliebt")}
                  ref={(el) => (sectionRefs.current["Beliebt"] = el)}
                  onAddToCart={addToCart}
                />
              )}

              {/* Pizza */}
              {grouped.get("Pizza") && (
                <Section
                  key="Pizza"
                  title="Pizza"
                  items={grouped.get("Pizza")}
                  ref={(el) => (sectionRefs.current["Pizza"] = el)}
                  onAddToCart={addToCart}
                />
              )}

              {/* Other categories */}
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

        {/* 🛒 CART */}
        {page === "Cart" && (
          <div className="flex justify-center items-center w-full min-h-screen bg-amber-200">
            <Cart onNavigate={handleNavigate} />
          </div>
        )}

        {/* 🧾 CHECKOUT */}
        {page === "Checkout" && user && (
          <Checkout onNavigate={handleNavigate} />
        )}
        {page === "CheckoutLogin" && (
          <Checkout onNavigate={handleNavigate} initialMode="login" />
        )}
        {page === "CheckoutRegister" && (
          <Checkout onNavigate={handleNavigate} initialMode="register" />
        )}

        {/* 💳 PAYMENT */}
        {page === "CheckoutPayment" && user && (
          <CheckoutPayment onNavigate={handleNavigate} />
        )}

        {/* 📦 ORDERS */}
        {page === "Orders" && <Orders onNavigate={handleNavigate} />}

        {/* 👤 PROFILE */}
        {page === "Profile" && user && <Profile onNavigate={handleNavigate} />}

        {/* 🛠️ ADMIN */}
        {page === "Admin" && <Admin onNavigate={handleNavigate} />}
      </main>

      {/* 🦶 FOOTER */}
      {!hideFooter && (
        <footer className="py-6 text-xs text-slate-700 bg-white border-t">
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
