import { useState, useRef, useEffect } from "react";
import { useCart } from "../pages/CartContext";
import { useAuth } from "../pages/AuthContext";

export default function NavBar({ activePage, onNavigate }) {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef();

  const navItems = [
    { key: "Home", label: "Home", icon: "/pizza.png" },
    { key: "Warenkorb", label: "Warenkorb", icon: "/shopping-bag.png" },
    { key: "Kasse", label: "Kasse", icon: "/checkout.png" },
  ];

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Navigation logic with login check
  const handleLinkClick = (link) => {
    // Scroll to top if already on the same tab
    if (
      (link === "Home" && activePage === "Home") ||
      (link === "Warenkorb" && activePage === "Cart") ||
      (link === "Kasse" && activePage === "CheckoutPayment")
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Handle each navigation case
    if (link === "Kasse") {
      if (user) {
        onNavigate("CheckoutPayment");
      } else {
        localStorage.setItem("redirectAfterLogin", "CheckoutPayment");
        onNavigate("CheckoutLogin");
      }
    } else if (link === "Warenkorb") {
      onNavigate("Cart");
    } else if (link === "Home") {
      onNavigate("Home");
    }
  };
  
  // Allow direct navigation on URL load
  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, "");
    if (path === "profile") {
      if (user) onNavigate("Profile"); else onNavigate("CheckoutLogin");
    } else if (path === "orders") {
      if (user) onNavigate("Orders"); else onNavigate("CheckoutLogin");
    } else if (path === "admin" && user?.role === "admin") {
      onNavigate("Admin");
    }
  }, [user]);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="BellaBiladi"
              className="h-9 w-9 cursor-pointer rounded-full border border-amber-200"
              onClick={() => onNavigate("Home")}
            />
          </div>

          <div className="flex items-center gap-2">
            {navItems.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => handleLinkClick(key)}
                className={`relative flex items-center justify-center text-sm px-3 py-1.5 rounded-full transition-colors ${
                  activePage === key ||
                  (key === "Warenkorb" && activePage === "Cart") ||
                  (key === "Kasse" && activePage === "CheckoutPayment")
                    ? "bg-amber-400 text-black font-semibold shadow"
                    : "hover:bg-amber-100 text-gray-700"
                }`}
              >
                <span className="relative">
                  <img src={icon} alt="" className="h-6 w-6" />
                  {key === "Warenkorb" && cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[0.65rem] rounded-full px-1 transition-transform flex items-center justify-center min-w-[1.15rem] h-4 leading-none">
                      {cart.length}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("Profile");
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <img
                    src="/user.png"
                    alt="Profil"
                    className="h-7 w-7 rounded-full border border-amber-200 bg-amber-50 p-0.5"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.name}
                    {user.role === "admin" && (
                      <span className="ml-1 text-xs text-amber-600 font-semibold">(Admin)</span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100"
                  aria-label="Benutzermenü öffnen"
                >
                  ▾
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-lg w-48 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        onNavigate("Profile");
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700"
                    >
                      Profil
                    </button>
                    {/* Only show "My Orders" for non-admin users */}
                    {user?.role !== "admin" && (
                      <button
                        onClick={() => {
                          onNavigate("Orders");
                          setMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700"
                      >
                        Meine Bestellungen
                      </button>
                    )}

                    {/* Admin Dashboard - always show if user is admin */}
                    {user?.role === "admin" && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            onNavigate("Admin");
                            setMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-amber-50 text-sm font-medium text-amber-600 border-l-2 border-amber-400"
                        >
                          ⚙️ Admin Dashboard
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        onNavigate("Home");
                      }}
                      className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 w-full text-left font-medium text-sm"
                    >
                      <img
                        src="/logout.png"
                        alt="Abmelden"
                        className="h-4 w-4 opacity-80"
                      />
                      Abmelden
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => onNavigate("CheckoutLogin")}
                className="text-xs border rounded px-3 py-1 hover:bg-slate-100"
              >
                Anmelden
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}