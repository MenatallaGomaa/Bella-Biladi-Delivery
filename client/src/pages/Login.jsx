import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function Login({ onNavigate }) {
  const { login, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // 🧠 Automatically clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // clear any old errors

    try {
      await login(form.email, form.password);
      onNavigate("Checkout");
    } catch (err) {
      console.error("❌ Login error:", err.message);
      setError(err.message); // 👈 show error on screen
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-amber-200">
      <div className="bg-white w-[90%] max-w-[420px] p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Einloggen</h2>

        {/* 🔴 Error message visible to user */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 text-sm px-3 py-2 rounded text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            Einloggen
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Kein Konto?{" "}
          <button
            onClick={() => onNavigate("Register")}
            className="text-blue-600 underline"
          >
            Registrieren
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
