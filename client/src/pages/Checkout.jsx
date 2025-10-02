export default function Checkout() {
  return (
    <div className="bg-amber-200 min-h-screen flex flex-col items-center py-10 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Einloggen oder Konto erstellen
        </h2>

        <form className="space-y-4">
          <input
            type="text"
            placeholder="Vor- und Nachname"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-amber-300"
          />
          <input
            type="email"
            placeholder="Email Adresse"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-amber-300"
          />
          <input
            type="password"
            placeholder="Kennwort"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-amber-300"
          />

          <button
            type="submit"
            className="w-full bg-amber-400 py-2 rounded-lg font-semibold hover:bg-amber-500"
          >
            Registrieren
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Haben Sie ein Konto?{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
