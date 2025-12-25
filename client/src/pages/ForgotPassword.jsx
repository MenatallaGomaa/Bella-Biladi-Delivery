import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function ForgotPassword({ onNavigate }) {
  const { resetPasswordDirect } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail) {
      setError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    if (!trimmedPassword) {
      setError("Bitte gib ein neues Passwort ein.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordDirect(trimmedEmail, trimmedPassword);
      setSuccess(true);
      setTimeout(() => onNavigate("CheckoutLogin"), 2500);
    } catch (err) {
      setError(err.message || "Passwort konnte nicht zurückgesetzt werden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-200 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-4">Passwort zurücksetzen</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Gib deine E-Mail-Adresse und ein neues Passwort ein, um dein Passwort zurückzusetzen.
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded border border-green-300 bg-green-100 px-3 py-3 text-sm text-green-700">
            Passwort erfolgreich aktualisiert! Du wirst gleich zum Login weitergeleitet.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail-Adresse"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Neues Passwort"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort bestätigen"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 py-2 text-sm font-semibold transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Speichern…" : "Passwort zurücksetzen"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <button
            onClick={() => onNavigate("CheckoutLogin")}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Zurück zum Login
          </button>
          <button
            onClick={() => onNavigate("Home")}
            className="text-gray-500 underline hover:text-gray-700"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}
