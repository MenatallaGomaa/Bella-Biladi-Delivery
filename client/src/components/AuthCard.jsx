import { useState } from "react";
import { useAuth } from "../pages/AuthContext";

export default function AuthCard({ mode = "register" }) {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState(mode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Kennwort"
            className="w-full border rounded-lg px-3 py-2 pr-10"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
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
