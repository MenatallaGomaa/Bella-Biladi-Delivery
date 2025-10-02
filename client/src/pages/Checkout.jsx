export default function Checkout() {
  return (
    <div className="bg-amber-200 min-h-screen flex justify-center items-center sm:py-10 sm:px-4">
      <div
        className="
    bg-white 
    w-full h-full        /* fullscreen on mobile */
    rounded-none shadow-none 
    sm:rounded-xl sm:shadow-md /* card style on bigger screens */
    p-4 sm:p-6 
    flex flex-col justify-center
  "
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6">
          Einloggen oder Konto erstellen
        </h2>

        <form className="space-y-4">
          <input
            type="text"
            placeholder="Vor- und Nachname"
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email Adresse"
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="password"
            placeholder="Kennwort"
            autoComplete="current-password"
            className="w-full border rounded-lg px-3 py-2"
          />
          <button className="w-full bg-amber-400 px-6 py-2 rounded-lg font-semibold hover:bg-amber-500">
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
