import { useState, useRef, useEffect } from "react";
import { useCart } from "../pages/CartContext";
import { useAuth } from "../pages/AuthContext";

export default function NavBar({ activePage, onNavigate }) {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef();

  const links = ["Home", "Warenkorb", "Kasse", "Kontakt", "Catering"];

  // ✅ Dropdown schließen, wenn außerhalb geklickt wird
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Navigation mit Login-Überprüfung + Scroll-Reset
  const handleLinkClick = (link) => {
    // 👇 Wenn der Nutzer auf denselben Tab klickt → nach oben scrollen
    if (
      (link === "Home" && activePage === "Home") ||
      (link === "Warenkorb" && activePage === "Cart") ||
      (link === "Kasse" && activePage === "CheckoutPayment") ||
      (link === "Kontakt" && activePage === "Contact") ||
      (link === "Catering" && activePage === "Catering")
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 👇 Logik für Kasse: Nur wenn eingeloggt, sonst Weiterleitung zu Login
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
    } else if (link === "Kontakt") {
      onNavigate("Contact");
    } else if (link === "Catering") {
      onNavigate("Catering");
    }
  };

  return (
    <nav className="h-12 flex items-center justify-between bg-white border-b border-gray-400 px-4 relative">
      {/* Linke Seite — Logo + Navigationslinks */}
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
            {/* 🛒 Badge für Warenkorb */}
            {link === "Warenkorb" && cart.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-500 text-white text-xs rounded-full px-2">
                {cart.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rechte Seite — Benutzer-Menü oder Login/Register */}
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        {user ? (
          <>
            {/* 👤 Benutzer-Icon */}
            <img
              src="/user.png"
              alt="Benutzer"
              className="h-6 w-6 cursor-pointer hover:opacity-80"
              onClick={() => setMenuOpen((prev) => !prev)}
            />

            {/* ✅ Dropdown-Menü */}
            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white border border-gray-300 rounded-lg shadow-md w-44 z-50">
                <button
                  onClick={() => {
                    onNavigate("Orders");
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700"
                >
                  Meine Bestellungen
                </button>

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
          <>
            <button
              onClick={() => onNavigate("CheckoutLogin")}
              className="text-xs border rounded px-2 py-1 hover:bg-slate-100"
            >
              Anmelden
            </button>
            <button
              onClick={() => onNavigate("CheckoutRegister")}
              className="text-xs bg-slate-900 text-white rounded px-2 py-1 hover:bg-slate-700"
            >
              Registrieren
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
