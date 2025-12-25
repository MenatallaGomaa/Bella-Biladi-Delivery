import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function ForgotPassword({ onNavigate }) {
  const { requestPasswordReset, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resetUrl, setResetUrl] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  
  // Reset password form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setPreviewUrl(null);
    setResetUrl(null);
    setResetToken(null);
    setPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetSuccess(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(trimmed);
      
      // Check if email was actually sent (in development mode)
      if (result?.success === false) {
        setError(result?.emailError || result?.message || "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.");
        // Still show reset URL in development for testing purposes
        if (result?.resetUrl) {
          setResetUrl(result.resetUrl);
        }
        if (result?.resetToken) {
          setResetToken(result.resetToken);
        }
      } else {
        setSuccess(true);
        // Store reset token to show reset form directly
        if (result?.resetToken) {
          setResetToken(result.resetToken);
        }
        // In development, show Ethereal preview URL
        if (result?.previewUrl) {
          setPreviewUrl(result.previewUrl);
        }
        if (result?.resetUrl) {
          setResetUrl(result.resetUrl);
        }
        // Show email error as warning if present (but still show success)
        if (result?.emailError) {
          console.warn("Email error (but request succeeded):", result.emailError);
        }
      }
    } catch (err) {
      setError(err.message || "Etwas ist schief gelaufen");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    
    const trimmed = password.trim();
    if (trimmed.length < 6) {
      setResetError("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (trimmed !== confirmPassword.trim()) {
      setResetError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetToken, trimmed);
      setResetSuccess(true);
      setTimeout(() => onNavigate("CheckoutLogin"), 2500);
    } catch (err) {
      setResetError(err.message || "Passwort konnte nicht zurückgesetzt werden.");
    } finally {
      setResetLoading(false);
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

        {resetSuccess ? (
          <div className="rounded border border-green-300 bg-green-100 px-3 py-3 text-sm text-green-700">
            Passwort erfolgreich aktualisiert! Du wirst gleich zum Login weitergeleitet.
          </div>
        ) : resetToken ? (
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
                </>
              ) : (
                <p className="mb-2 font-semibold">✅ Reset-Link wurde generiert!</p>
                <p>Sie können Ihr Passwort direkt hier zurücksetzen:</p>
              )}
            </div>
            
            {/* Reset Password Form */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-3">Passwort zurücksetzen</h2>
              {resetError && (
                <div className="mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700">
                  {resetError}
                </div>
              )}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  type="password"
                  placeholder="Neues Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <input
                  type="password"
                  placeholder="Passwort bestätigen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-lg bg-amber-400 py-2 text-sm font-semibold transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetLoading ? "Speichern…" : "Passwort speichern"}
                </button>
              </form>
            </div>
            
            {resetUrl && (
              <div className="mt-3 p-2 bg-gray-50 rounded border">
                <p className="text-xs text-gray-600 mb-1">Oder verwenden Sie diesen Link:</p>
                <code className="text-xs break-all text-blue-600">{resetUrl}</code>
              </div>
            )}
          </div>
        ) : success ? (
          <div className="rounded border border-green-300 bg-green-100 px-3 py-3 text-sm text-green-700">
            <p>Wir haben dir (falls vorhanden) eine E-Mail mit weiteren Schritten geschickt. Bitte überprüfe dein Postfach und klicke auf den Link in der E-Mail.</p>
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
