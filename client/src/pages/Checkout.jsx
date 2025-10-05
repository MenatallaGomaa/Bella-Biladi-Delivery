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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="
        flex justify-center items-center 
        min-h-screen 
        bg-gradient-to-br from-amber-200 via-orange-300 to-amber-500
        text-white 
        sm:bg-amber-200 sm:text-black sm:overflow-auto
        relative
      "
    >
      {/* 🔙 Zurück button */}
      <button
        onClick={() => onNavigate && onNavigate("Cart")}
        className="
          absolute top-6 left-6 
          text-white sm:text-black 
          font-medium text-sm 
          bg-white/20 sm:bg-transparent 
          hover:bg-white/30 
          px-3 py-1.5 rounded-lg 
          backdrop-blur-sm
          transition
        "
      >
        ← Zurück
      </button>

      {/* 🔶 Main content */}
      <div
        className="
          w-full max-w-[90%] sm:max-w-lg md:max-w-xl 
          px-6 sm:px-10 
          py-16 sm:py-12 
          sm:bg-white sm:rounded-3xl sm:shadow-2xl
          flex flex-col justify-center
          h-screen sm:h-auto
        "
      >
        <h2 className="text-4xl sm:text-4xl font-bold mb-10 text-left sm:text-center">
          {isLogin ? "Einloggen" : "Registrieren"}
        </h2>

        {error && (
          <div className="bg-white/20 sm:bg-red-100 border border-white/40 sm:border-red-400 text-red-200 sm:text-red-700 text-center text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <input
              type="text"
              placeholder="Vor- und Nachname"
              className="
                w-full bg-white/15 sm:bg-transparent 
                border border-white/30 sm:border-gray-300 
                rounded-lg px-4 py-4 text-base sm:text-lg 
                placeholder-white/70 sm:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-white sm:focus:ring-amber-400
                text-white sm:text-black
              "
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email Adresse"
            className="
              w-full bg-white/15 sm:bg-transparent 
              border border-white/30 sm:border-gray-300 
              rounded-lg px-4 py-4 text-base sm:text-lg 
              placeholder-white/70 sm:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-white sm:focus:ring-amber-400
              text-white sm:text-black
            "
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Kennwort"
            className="
              w-full bg-white/15 sm:bg-transparent 
              border border-white/30 sm:border-gray-300 
              rounded-lg px-4 py-4 text-base sm:text-lg 
              placeholder-white/70 sm:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-white sm:focus:ring-amber-400
              text-white sm:text-black
            "
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="submit"
            className="
              w-full py-3 rounded-lg text-base font-semibold
              bg-white text-amber-700 
              sm:bg-amber-400 sm:text-black
              hover:bg-opacity-90 transition
            "
          >
            {isLogin ? "Einloggen" : "Registrieren"}
          </button>
        </form>

        <p className="text-left sm:text-center text-sm mt-6">
          {isLogin ? (
            <>
              Kein Konto?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="underline font-medium text-white sm:text-blue-600"
              >
                Registrieren
              </button>
            </>
          ) : (
            <>
              Haben Sie ein Konto?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="underline font-medium text-white sm:text-blue-600"
              >
                Login
              </button>
            </>
          )}
        </p>

        {user && (
          <p className="mt-4 text-center text-green-200 sm:text-green-600 text-lg">
            Willkommen, {user.name}! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
