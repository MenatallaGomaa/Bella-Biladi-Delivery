import { useState } from "react";
import { useAuth } from "../pages/AuthContext";

export default function AuthCard({ mode = "register" }) {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState(mode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (authMode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="bg-white w-full max-w-sm sm:max-w-md rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">
        {authMode === "login" ? "Einloggen" : "Registrieren"}
      </h2>

      {error && <p className="text-red-500 text-center mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === "register" && (
          <input
            type="text"
            placeholder="Vor- und Nachname"
            className="w-full border rounded-lg px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}

        <input
          type="email"
          placeholder="Email Adresse"
          className="w-full border rounded-lg px-3 py-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Kennwort"
          className="w-full border rounded-lg px-3 py-2"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="current-password"
        />

        <button
          type="submit"
          className="w-full bg-amber-400 px-6 py-2 rounded-lg font-semibold hover:bg-amber-500"
        >
          {authMode === "login" ? "Einloggen" : "Registrieren"}
        </button>
      </form>

      <p className="text-center text-sm mt-4">
        {authMode === "login" ? (
          <>
            Kein Konto?{" "}
            <button
              onClick={() => setAuthMode("register")}
              className="text-blue-600 underline"
            >
              Registrieren
            </button>
          </>
        ) : (
          <>
            Haben Sie ein Konto?{" "}
            <button
              onClick={() => setAuthMode("login")}
              className="text-blue-600 underline"
            >
              Login
            </button>
          </>
        )}
      </p>
    </div>
  );
}
