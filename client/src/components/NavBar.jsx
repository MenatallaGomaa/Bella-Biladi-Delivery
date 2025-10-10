import { useState, useRef, useEffect } from "react";
import { useCart } from "../pages/CartContext";
import { useAuth } from "../pages/AuthContext";

export default function NavBar({ activePage, onNavigate }) {
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef();

  const links = ["Home", "Cart", "Checkout", "Contact", "Catering"];

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

  return (
    <nav className="h-12 flex items-center justify-between bg-white border-b border-gray-400 px-4 relative">
      {/* Left side — logo + links */}
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
            onClick={() => onNavigate(link)}
            className={`relative text-sm px-2 py-1 rounded transition-colors ${
              activePage === link
                ? "bg-amber-400 text-black font-semibold"
                : "hover:bg-amber-200 hover:text-black"
            }`}
          >
            {link}
            {link === "Cart" && cart.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-500 text-white text-xs rounded-full px-2">
                {cart.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right side — user menu or auth buttons */}
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        {user ? (
          <>
            {/* 👤 User Icon */}
            <img
              src="/user.png"
              alt="User"
              className="h-6 w-6 cursor-pointer hover:opacity-80"
              onClick={() => setMenuOpen((prev) => !prev)}
            />

            {/* ✅ Dropdown Menu */}
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
                    alt="Logout"
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
              Sign in
            </button>
            <button
              onClick={() => onNavigate("CheckoutRegister")}
              className="text-xs bg-slate-900 text-white rounded px-2 py-1 hover:bg-slate-700"
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
