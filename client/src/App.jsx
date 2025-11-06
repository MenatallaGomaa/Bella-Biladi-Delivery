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
  const [showScrollTop, setShowScrollTop] = useState(false);
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

  // 📜 Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      setShowScrollTop(scrollPosition > 300); // Show after scrolling 300px
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ⬆️ Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // 🗂️ Category mapping: database category -> UI category name
  const categoryMap = useMemo(() => {
    return {
      "Popular": "Beliebt",
      "Pizza rolls": "Pizzabrötchen",
      "Baked Pasta": "Pasta Überbacken",
      "French fries": "Pommes Frites",
      "drinks": "Getränke",
      "Desserts": "Desserts",
      "Pizza": "Pizza",
      "Spaghetti": "Spaghetti",
      "Burger": "Burger",
    };
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
    // Get unique categories from items, mapped to UI names
    const dynamic = items.map((i) => {
      const dbCategory = i.category || "Pizza";
      return categoryMap[dbCategory] || dbCategory;
    });
    return [...new Set([...defaults, ...dynamic])];
  }, [items, categoryMap]);

  const grouped = useMemo(() => {
    const m = new Map();
    items.forEach((i) => {
      const dbCategory = i.category || "Pizza";
      // Map database category to UI category name
      const uiCategory = categoryMap[dbCategory] || dbCategory;
      if (!m.has(uiCategory)) m.set(uiCategory, []);
      m.get(uiCategory).push(i);
    });
    return m;
  }, [items, categoryMap]);

  // 📜 Smooth scroll when switching tabs
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const section = sectionRefs.current[active];
      if (section) {
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset for navbar
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 150);
    return () => clearTimeout(timer);
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

              {/* Render all categories in order */}
              {categories.map((cat) => {
                const items = grouped.get(cat) || [];
                if (items.length === 0) return null;
                
                return (
                  <Section
                    key={cat}
                    title={cat}
                    items={cat === "Beliebt" ? items.slice(0, 5) : items}
                    ref={(el) => (sectionRefs.current[cat] = el)}
                    onAddToCart={addToCart}
                  />
                );
              })}
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

      {/* ⬆️ Scroll to Top Button - Only show on Home page */}
      {showScrollTop && page === "Home" && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-amber-400 hover:bg-amber-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 group"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
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
