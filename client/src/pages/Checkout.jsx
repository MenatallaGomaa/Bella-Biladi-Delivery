import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Checkout() {
  const { login, register, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // clear previous errors

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      console.error("❌ Auth error:", err.message);
      setError(err.message); // 👈 show error in UI
    }
  };

  return (
    <div className="bg-amber-200 min-h-screen flex items-center justify-center">
      <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-center mb-4">
          {isLogin ? "Einloggen" : "Registrieren"}
        </h2>

        {/* 🔴 Persistent error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 text-sm px-3 py-2 rounded text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <input
              type="text"
              placeholder="Vor- und Nachname"
              className="w-full border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
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
