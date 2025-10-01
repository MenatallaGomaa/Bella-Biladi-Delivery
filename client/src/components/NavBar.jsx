import { useState } from "react";
import { useCart } from "../pages/CartContext";

export default function NavBar({ onNavigate }) {
  const [active, setActive] = useState("Home");
  const { cart } = useCart();

  const links = ["Home", "Cart", "Checkout", "Contact", "Catering"];

  return (
    <nav className="h-12 flex items-center justify-between bg-white shadow-sm px-4">
      <div className="flex items-center gap-3">
        <img
          src="/logo.jpeg"
          alt="BellaBiladi"
          className="h-8 w-8 cursor-pointer"
          onClick={() => {
            setActive("Home");
            onNavigate("Home");
          }}
        />
        {links.map((link) => (
          <button
            key={link}
            onClick={() => {
              setActive(link);
              onNavigate(link);
            }}
            className={`relative text-sm px-2 py-1 rounded transition-colors ${
              active === link
                ? "bg-amber-200/60 font-medium"
                : "hover:text-amber-600"
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

      <div className="flex items-center gap-2">
        <button className="text-xs border rounded px-2 py-1 hover:bg-slate-100">
          Sign in
        </button>
        <button className="text-xs bg-slate-900 text-white rounded px-2 py-1 hover:bg-slate-700">
          Register
        </button>
      </div>
    </nav>
  );
}
