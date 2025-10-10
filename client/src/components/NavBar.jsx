import { useCart } from "../pages/CartContext";
import { useAuth } from "../pages/AuthContext"; // ✅ Import user context

export default function NavBar({ activePage, onNavigate }) {
  const { cart } = useCart();
  const { user, logout } = useAuth(); // ✅ Access user info & logout
  const links = ["Home", "Cart", "Checkout", "Contact", "Catering"];

  return (
    <nav className="h-12 flex items-center justify-between bg-white border-b border-gray-400 px-4">
      {/* ✅ Left side — logo + links */}
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

      {/* ✅ Right side — user or auth buttons */}
      <div className="flex items-center gap-2">
        {user ? (
          // ✅ Show user icon when logged in
          <div className="relative group">
            <img
              src="/user.png"
              alt="User"
              className="h-8 w-8 rounded-full border cursor-pointer hover:ring-2 hover:ring-amber-400 transition"
              onClick={() => onNavigate("Orders")} // Go to order history page
            />

            {/* Optional dropdown (logout, etc.) */}
            <div className="hidden group-hover:block absolute right-0 mt-2 bg-white border rounded-lg shadow-md text-sm w-32">
              <button
                onClick={() => onNavigate("Orders")}
                className="block w-full text-left px-4 py-2 hover:bg-amber-100"
              >
                Meine Bestellungen
              </button>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-amber-100"
              >
                Abmelden
              </button>
            </div>
          </div>
        ) : (
          // ✅ Show login/register if not signed in
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
