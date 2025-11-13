import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import CategoryPills from "./components/CategoryPills";
import Section from "./components/Section";
import FixedCart from "./components/FixedCart";
import AdminOrderNotification from "./components/AdminOrderNotification";
import { CartProvider, useCart } from "./pages/CartContext";
import { AuthProvider, useAuth } from "./pages/AuthContext";
import CheckoutPayment from "./pages/CheckoutPayment";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Driver from "./pages/Driver";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import "./index.css";

function MainApp() {
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");
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
      driver: "Driver",
      "forgot-password": "ForgotPassword",
      "reset-password": "ResetPassword",
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
      Driver: "/driver",
      ForgotPassword: "/forgot-password",
      ResetPassword: (() => {
        const search = window.location.search;
        return search && search.includes("token=")
          ? `/reset-password${search}`
          : "/reset-password";
      })(),
    };
    const path = map[page] || "/home";
    window.history.pushState({}, "", path);
  }, [page]);

  // 🍕 Fetch menu items with retry logic for cold starts
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 2000; // Start with 2 seconds
    
    const fetchItemsWithRetry = async () => {
      setItemsLoading(true);
      setItemsError("");
      
      const attemptFetch = async (attemptNumber) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout per attempt
          
          const response = await api.get("/api/items", {
            signal: controller.signal,
            timeout: 15000,
          });
          
          clearTimeout(timeoutId);
          setItems(response.data || []);
          setItemsLoading(false);
          setItemsError("");
          console.log("✅ Items loaded successfully");
          return true; // Success
        } catch (err) {
          clearTimeout(timeoutId);
          
          if (attemptNumber < maxRetries) {
            const delay = baseDelay * Math.pow(2, attemptNumber); // Exponential backoff
            console.log(`⚠️ Backend not ready (attempt ${attemptNumber + 1}/${maxRetries}), retrying in ${delay/1000}s...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptFetch(attemptNumber + 1);
          } else {
            // All retries failed
            console.error("❌ Failed to load items after", maxRetries, "attempts:", err.message);
            setItemsError("Backend wird gestartet... Bitte warten Sie einen Moment und laden Sie die Seite neu.");
            setItemsLoading(false);
            // Keep trying in background every 10 seconds
            setTimeout(() => {
              console.log("🔄 Retrying items fetch in background...");
              fetchItemsWithRetry();
            }, 10000);
            return false;
          }
        }
      };
      
      attemptFetch(0);
    };
    
    fetchItemsWithRetry();
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
      "Salads": "Salate & Antipasti",
      "Fingerfood": "Fingerfood",
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
      "Salate & Antipasti",
      "Fingerfood",
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
    page === "CheckoutRegister" ||
    page === "ForgotPassword" ||
    page === "ResetPassword";

  const hideFooter =
    page === "Checkout" ||
    page === "CheckoutLogin" ||
    page === "CheckoutRegister" ||
    page === "CheckoutPayment" ||
    page === "Cart" ||
    page === "ForgotPassword" ||
    page === "ResetPassword" ||
    page === "Profile" ||
    page === "Orders" ||
    page === "Admin" ||
    page === "Driver";

  const hideFixedCart =
    page === "Checkout" ||
    page === "CheckoutLogin" ||
    page === "CheckoutRegister" ||
    page === "CheckoutPayment" ||
    page === "Cart" ||
    page === "ForgotPassword" ||
    page === "ResetPassword" ||
    page === "Profile" ||
    page === "Orders" ||
    page === "Admin" ||
    page === "Driver";

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
      "Driver",
    ];

    if (protectedPages.includes(newPage) && !user) {
      localStorage.setItem("redirectAfterLogin", newPage);
      setPage("CheckoutLogin");
      return;
    }

    // 🔐 Redirect admin users from Orders to Admin Dashboard
    if (newPage === "Orders" && user?.role === "admin") {
      setPage("Admin");
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
      <div className="flex flex-col justify-center items-center h-screen bg-amber-200">
        <div className="text-lg font-semibold text-gray-700 mb-4">
          Benutzerstatus wird geladen...
        </div>
        <div className="text-sm text-gray-600">
          Bitte warten Sie einen Moment
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
        } ${!hideFixedCart ? "pb-20 sm:pb-16" : ""}`}
      >
        {page === "ForgotPassword" && (
          <ForgotPassword onNavigate={handleNavigate} />
        )}

        {page === "ResetPassword" && (
          <ResetPassword onNavigate={handleNavigate} />
        )}

        {/* 🏠 HOME */}
        {page === "Home" && (
          <div className="bg-amber-200">
            <Hero />
            <div className="max-w-5xl mx-auto px-3 py-6">
              <h2 className="text-3xl font-bold mb-4">BellaBiladi</h2>

              {/* Loading State */}
              {itemsLoading && (
                <div className="bg-white rounded-lg p-8 text-center mb-6">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-4"></div>
                  <p className="text-gray-700 font-medium">Menü wird geladen...</p>
                  <p className="text-sm text-gray-500 mt-2">Backend wird gestartet, bitte warten Sie einen Moment</p>
                </div>
              )}

              {/* Error State */}
              {itemsError && !itemsLoading && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">{itemsError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm font-medium text-yellow-800 underline"
                      >
                        Seite neu laden
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {!itemsLoading && items.length > 0 && (
                <>
                  <CategoryPills
                    tabs={categories}
                    active={active}
                    onPick={setActive}
                  />

                  {/* Render all categories in order */}
                  {categories.map((cat) => {
                    const categoryItems = grouped.get(cat) || [];
                    if (categoryItems.length === 0) return null;
                    
                    return (
                      <Section
                        key={cat}
                        title={cat}
                        items={cat === "Beliebt" ? categoryItems.slice(0, 5) : categoryItems}
                        ref={(el) => (sectionRefs.current[cat] = el)}
                        onAddToCart={addToCart}
                      />
                    );
                  })}
                </>
              )}

              {/* Empty State */}
              {!itemsLoading && !itemsError && items.length === 0 && (
                <div className="bg-white rounded-lg p-8 text-center">
                  <p className="text-gray-600">Keine Artikel verfügbar.</p>
                </div>
              )}
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

        {/* 🚴 DRIVER */}
        {page === "Driver" && <Driver onNavigate={handleNavigate} />}
      </main>

      {/* 🦶 FOOTER */}
      {!hideFooter && (
        <footer className={`py-8 text-sm text-slate-700 bg-white border-t ${!hideFixedCart ? "pb-24 sm:pb-20" : ""}`}>
          <div className="max-w-5xl mx-auto px-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Contact & Address */}
              <div>
                <div className="font-semibold text-base mb-2 text-amber-600">Kontakt</div>
                <div className="space-y-1">
                  <div className="font-medium">Bella Biladi</div>
                  <div>Probstheidaer Straße 21</div>
                  <div>04277 Leipzig, Germany</div>
                  <div className="mt-2">
                    <div>Phone: <a href="tel:+4915213274837" className="text-amber-600 hover:text-amber-700 hover:underline">01521 3274837</a></div>
                    <div className="mt-1">Vertretungsberechtigt: Khalil Mountahi</div>
                  </div>
                </div>
              </div>

              {/* Social Media & Links */}
              <div>
                <div className="font-semibold text-base mb-2 text-amber-600">Folge uns</div>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://www.instagram.com/bella.biladi.pizza.auf.raedern/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-amber-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://www.facebook.com/p/Bella-Biladi-Pizza-100086382703041/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-amber-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </a>
                  <a
                    href="https://bellabiladipizzeria.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-amber-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span>Catering Website</span>
                  </a>
                </div>
              </div>

              {/* Legal */}
              <div>
                <div className="font-semibold text-base mb-2 text-amber-600">Rechtliches</div>
                <div className="space-y-1">
                  <div>Impressum</div>
                  <div>Datenschutz</div>
                  <div>AGB</div>
                </div>
              </div>
            </div>

            {/* Copyright & Credits */}
            <div className="pt-6 border-t border-gray-200 text-center text-xs text-slate-500">
              <div className="mb-1">
                © {new Date().getFullYear()} Bella Biladi. Alle Rechte vorbehalten.
              </div>
              <div>
                Entwickelt von{" "}
                <a
                  href="https://www.linkedin.com/in/menatalla-gomaa-0703mg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-600 hover:text-amber-700 hover:underline transition-colors inline-flex items-center gap-1"
                >
                  <span>Menatalla Gomaa</span>
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ⬆️ Scroll to Top Button - Only show on Home page */}
      {showScrollTop && page === "Home" && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 sm:bottom-20 right-8 z-40 bg-amber-400 hover:bg-amber-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 group"
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

      {/* 🛒 Fixed Cart - Always visible except on checkout pages */}
      {!hideFixedCart && <FixedCart onNavigate={handleNavigate} />}

      {/* 🔔 Admin Order Notification - Global popup for new orders */}
      <AdminOrderNotification onNavigate={handleNavigate} />
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
