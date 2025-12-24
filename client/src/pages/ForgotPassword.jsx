import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function ForgotPassword({ onNavigate }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resetUrl, setResetUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setPreviewUrl(null);
    setResetUrl(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(trimmed);
      setSuccess(true);
      // In development, show Ethereal preview URL
      if (result?.previewUrl) {
        setPreviewUrl(result.previewUrl);
      }
      if (result?.resetUrl) {
        setResetUrl(result.resetUrl);
      }
    } catch (err) {
      setError(err.message || "Etwas ist schief gelaufen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-200 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-4">Passwort vergessen</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Gib deine E-Mail-Adresse ein. Wenn sie bei uns registriert ist, senden wir dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="rounded border border-green-300 bg-green-100 px-3 py-3 text-sm text-green-700">
              {previewUrl ? (
                <>
                  <p className="mb-2 font-semibold">✅ E-Mail wurde gesendet!</p>
                  <p className="mb-3">In der Entwicklungsumgebung können Sie die E-Mail hier ansehen:</p>
                  <a 
                    href={previewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold mb-3"
                  >
                    📧 E-Mail-Vorschau öffnen
                  </a>
                  {resetUrl && (
                    <div className="mt-3 p-2 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Oder kopieren Sie diesen Link:</p>
                      <code className="text-xs break-all text-blue-600">{resetUrl}</code>
                    </div>
                  )}
                </>
              ) : (
                <p>Wir haben dir (falls vorhanden) eine E-Mail mit weiteren Schritten geschickt. Bitte überprüfe dein Postfach und klicke auf den Link in der E-Mail.</p>
              )}
            </div>
            {resetUrl && !previewUrl && (
              <div className="rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                <p className="font-semibold mb-2">Direkter Reset-Link:</p>
                <button
                  onClick={() => {
                    window.location.href = resetUrl;
                  }}
                  className="text-blue-600 underline hover:text-blue-800 break-all text-left"
                >
                  {resetUrl}
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail-Adresse"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 py-2 text-sm font-semibold transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Senden…" : "Link anfordern"}
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
