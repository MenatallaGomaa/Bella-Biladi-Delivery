import { useState, useRef, useEffect } from "react";
import { useCart } from "../pages/CartContext";
import { useAuth } from "../pages/AuthContext";

export default function NavBar({ activePage, onNavigate }) {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef();

  // ✅ Only keep the needed links
  const links = ["Home", "Warenkorb", "Kasse"];

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
    <nav className="h-12 flex items-center justify-between bg-white border-b border-gray-400 px-4 relative">
      {/* Left side — Logo + Links */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.jpeg"
          alt="BellaBiladi"
          className="h-8 w-8 cursor-pointer"
          onClick={() => onNavigate("Home")}
        />

        {links.map((link) => (
          <button
            key={link}
            onClick={() => handleLinkClick(link)}
            className={`relative text-sm px-2 py-1 rounded transition-colors ${
              activePage === link ||
              (link === "Warenkorb" && activePage === "Cart") ||
              (link === "Kasse" && activePage === "CheckoutPayment")
                ? "bg-amber-400 text-black font-semibold"
                : "hover:bg-amber-200 hover:text-black"
            }`}
          >
            {link}
            {/* 🛒 Cart badge */}
            {link === "Warenkorb" && cart.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-500 text-white text-xs rounded-full px-2">
                {cart.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right side — User menu or login */}
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        {user ? (
          <>
            {/* 👤 User icon */}
            <img
              src="/user.png"
              alt="Benutzer"
              className="h-6 w-6 cursor-pointer hover:opacity-80"
              onClick={() => setMenuOpen((prev) => !prev)}
            />

            {/* ✅ Dropdown-Menü */}
            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white border border-gray-300 rounded-xl shadow-lg w-44 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    onNavigate("Profile");
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700"
                >
                  Profil
                </button>
                <button
                  onClick={() => {
                    onNavigate("Orders");
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700"
                >
                  Meine Bestellungen
                </button>

                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      onNavigate("Admin");
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700"
                  >
                    Admin
                  </button>
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
            className="text-xs border rounded px-2 py-1 hover:bg-slate-100"
          >
            Anmelden
          </button>
        )}
      </div>
    </nav>
  );
}
