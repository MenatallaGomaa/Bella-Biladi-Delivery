import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login({ onNavigate }) {
  const { login, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      onNavigate("Checkout"); // ✅ redirect after successful login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-amber-200 min-h-screen flex items-center justify-center">
      <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-center mb-4">Einloggen</h2>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email Adresse"
            className="w-full border rounded px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Kennwort"
            className="w-full border rounded px-3 py-2"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="w-full bg-amber-400 py-2 rounded-lg hover:bg-amber-500 font-semibold">
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
          <p className="text-green-600 text-center mt-2">
            Willkommen, {user.name}! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
