import { useCart } from "../pages/CartContext";

export default function NavBar({ activePage, onNavigate }) {
  const { cart } = useCart();

  const links = ["Home", "Cart", "Checkout", "Contact", "Catering"];

  return (
    <nav className="h-12 flex items-center justify-between bg-white border-b border-gray-400 px-4">
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

      {/* Right side — auth buttons */}
      <div className="flex items-center gap-2">
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
      </div>
    </nav>
  );
}
