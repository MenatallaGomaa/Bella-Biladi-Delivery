import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function Register({ onNavigate }) {
  const { register, user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🧠 Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ✅ Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPage = localStorage.getItem("redirectAfterLogin") || "Home";
      localStorage.removeItem("redirectAfterLogin");
      onNavigate(
        redirectPage === "Checkout" ? "CheckoutPayment" : redirectPage
      );
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await register(form.name, form.email, form.password);

      // ✅ Redirect after successful registration
      const redirectPage = localStorage.getItem("redirectAfterLogin") || "Home";
      localStorage.removeItem("redirectAfterLogin");
      onNavigate(
        redirectPage === "Checkout" ? "CheckoutPayment" : redirectPage
      );
    } catch (err) {
      console.error("Register error:", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-[100vh] bg-amber-200 overflow-hidden">
      <div className="bg-white w-[90%] max-w-[420px] p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Registrieren</h2>

        {/* 🔴 Error message visible to user */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Vor- und Nachname"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email Adresse"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Kennwort"
              className="w-full border rounded-lg px-3 py-2 pr-10 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-amber-400 py-2 rounded-lg hover:bg-amber-500 font-semibold transition-colors"
          >
            Registrieren
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Haben Sie ein Konto?{" "}
          <button
            onClick={() => onNavigate("Login")}
            className="text-blue-600 underline"
          >
            Login
          </button>
        </p>

        {user && (
          <p className="text-green-600 text-center mt-4">
            Willkommen, {user.name}! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
