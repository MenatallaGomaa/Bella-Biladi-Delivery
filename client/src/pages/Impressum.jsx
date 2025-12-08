export default function Impressum({ onNavigate }) {
  return (
    <div className="min-h-screen bg-amber-200 pb-6">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Impressum</h1>
            <button
              onClick={() => onNavigate("Home")}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Zurück"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Angaben gemäß § 5 TMG
            </h2>
            <div className="text-gray-700 space-y-2">
              <p>
                <strong>BellaBiladi</strong>
              </p>
              <p>
                Probstheidaer Straße 21<br />
                04277 Leipzig<br />
                Deutschland
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Kontakt</h2>
            <div className="text-gray-700 space-y-2">
              <p>
                <strong>Telefon:</strong>{" "}
                <a
                  href="tel:+4915213274837"
                  className="text-amber-600 hover:text-amber-700 hover:underline"
                >
                  01521 3274837
                </a>
              </p>
              <p>
                <strong>E-Mail:</strong>{" "}
                <a
                  href="mailto:bellabiladipizza@gmail.com"
                  className="text-amber-600 hover:text-amber-700 hover:underline"
                >
                  bellabiladipizza@gmail.com
                </a>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="text-gray-700">
              <p>
                Khalil Mountahi<br />
                Probstheidaer Straße 21<br />
                04277 Leipzig<br />
                Deutschland
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              EU-Streitschlichtung
            </h2>
            <div className="text-gray-700">
              <p>
                Die Europäische Kommission stellt eine Plattform zur
                Online-Streitbeilegung (OS) bereit:{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                .<br />
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <div className="text-gray-700">
              <p>
                Wir sind nicht bereit oder verpflichtet, an
                Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

