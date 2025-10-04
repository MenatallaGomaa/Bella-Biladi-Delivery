import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    register(form.name, form.email, form.password);
  };

  return (
    <div className="bg-amber-200 min-h-screen flex justify-center items-center sm:py-10 sm:px-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Einloggen oder Konto erstellen
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Vor- und Nachname"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email Adresse"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="password"
            placeholder="Kennwort"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            className="w-full border rounded-lg px-3 py-2"
          />

          <button
            type="submit"
            className="w-full bg-amber-400 px-6 py-2 rounded-lg font-semibold hover:bg-amber-500"
          >
            Registrieren
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Haben Sie ein Konto?{" "}
          <a href="#" className="text-blue-600">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
