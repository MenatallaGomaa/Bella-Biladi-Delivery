import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function Checkout({ onNavigate, initialMode = "login" }) {
  const { login, register, user } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      // ✅ Redirect to payment page after successful auth
      onNavigate("CheckoutPayment");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-amber-300 via-orange-300 to-amber-500 text-white relative">
      {/* 🔙 Back button */}
      <button
        onClick={() => onNavigate && onNavigate("Cart")}
        className="absolute top-6 left-6 text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm font-medium"
      >
        ← Zurück
      </button>

      <div className="w-[90%] max-w-[420px] bg-white text-black p-8 rounded-2xl shadow-2xl sm:p-10">
        <h2 className="text-3xl font-bold text-center mb-6">
          {isLogin ? "Einloggen" : "Registrieren"}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 text-center text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Vor- und Nachname"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email Adresse"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Kennwort"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="submit"
            className="w-full bg-amber-400 py-2 rounded-lg hover:bg-amber-500 font-semibold transition-colors"
          >
            {isLogin ? "Einloggen" : "Registrieren"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          {isLogin ? (
            <>
              Kein Konto?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="text-blue-600 underline"
              >
                Registrieren
              </button>
            </>
          ) : (
            <>
              Haben Sie ein Konto?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-blue-600 underline"
              >
                Login
              </button>
            </>
          )}
        </p>

        {user && (
          <p className="mt-4 text-center text-green-600">
            Willkommen, {user.name}! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
