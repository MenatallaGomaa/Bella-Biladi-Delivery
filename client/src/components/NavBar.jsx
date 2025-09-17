import { useState } from "react";

export default function NavBar() {
  const [active, setActive] = useState("Home");

  const links = ["Home", "Cart", "Checkout", "Contact", "Catering"];

  return (
    <nav className="h-12 flex items-center justify-between bg-white shadow-sm px-4">
      <div className="flex items-center gap-3">
        <img src="/logo.jpeg" alt="BellaBiladi" className="h-8 w-8" />
        {links.map((link) => (
          <a
            key={link}
            href="#"
            onClick={() => setActive(link)}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              active === link
                ? "bg-amber-200/60 font-medium"
                : "hover:text-amber-600"
            }`}
          >
            {link}
          </a>
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
