import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function Register({ onNavigate }) {
  const { register, user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    register(form.name, form.email, form.password)
      .then(() => onNavigate("Checkout"))
      .catch((err) => {
        console.error("Register error:", err.message);
        setError(err.message);
      });
  };

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  return (
    <div className="flex justify-center items-center h-[100vh] bg-amber-200 overflow-hidden">
      <div className="bg-white w-[90%] max-w-[420px] p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Registrieren</h2>

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
          <input
            type="password"
            placeholder="Kennwort"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="submit"
            className="w-full bg-amber-400 py-2 rounded-lg hover:bg-amber-500 font-semibold"
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
