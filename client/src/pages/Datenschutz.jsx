export default function Datenschutz({ onNavigate }) {
  return (
    <div className="min-h-screen bg-amber-200 pb-6">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Datenschutzerklärung</h1>
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
          <p className="text-gray-600 text-sm">
            Stand: {new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Datenschutz auf einen Blick</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Allgemeine Hinweise</h3>
            <p className="text-gray-700 mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Datenerfassung auf dieser Website</h3>
            <p className="text-gray-700 mb-2">
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
            </p>

            <p className="text-gray-700 mb-2">
              <strong>Wie erfassen wir Ihre Daten?</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben oder bei der Bestellung angeben.
            </p>
            <p className="text-gray-700 mb-4">
              Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Hosting</h2>
            <p className="text-gray-700 mb-2">
              Diese Website wird bei Netlify gehostet. Anbieter ist Netlify, Inc., 44 Montgomery Street, Suite 350, San Francisco, California 94104, USA.
            </p>
            <p className="text-gray-700">
              Wenn Sie diese Website besuchen, erfasst Netlify verschiedene Logfiles inklusive Ihrer IP-Adressen. Details entnehmen Sie der Datenschutzerklärung von Netlify:{" "}
              <a
                href="https://www.netlify.com/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 hover:underline"
              >
                https://www.netlify.com/privacy/
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Allgemeine Hinweise und Pflichtinformationen</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Datenschutz</h3>
            <p className="text-gray-700 mb-4">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzbestimmungen sowie dieser Datenschutzerklärung.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Hinweis zur verantwortlichen Stelle</h3>
            <p className="text-gray-700 mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
            <div className="text-gray-700 mb-4">
              <p>
                <strong>BellaBiladi</strong><br />
                Probstheidaer Straße 21<br />
                04277 Leipzig<br />
                Deutschland
              </p>
              <p className="mt-2">
                Telefon:{" "}
                <a
                  href="tel:+4915213274837"
                  className="text-amber-600 hover:text-amber-700 hover:underline"
                >
                  01521 3274837
                </a>
                <br />
                E-Mail:{" "}
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
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Datenerfassung auf dieser Website</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Kontaktformular / Bestellung</h3>
            <p className="text-gray-700 mb-2">
              Wenn Sie uns per Kontaktformular oder bei einer Bestellung Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Erhobene Daten:</strong> Name, E-Mail-Adresse, Telefonnummer, Lieferadresse, Bestelldetails
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Speicherdauer:</strong> Die Daten werden gelöscht, sobald sie für die Bearbeitung Ihrer Anfrage nicht mehr erforderlich sind und gesetzliche Aufbewahrungsfristen nicht entgegenstehen.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Registrierung / Konto</h3>
            <p className="text-gray-700 mb-2">
              Sie können sich auf unserer Website registrieren, um ein Konto zu erstellen. Die dabei erhobenen Daten werden zur Bereitstellung und Verwaltung Ihres Kontos verwendet.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Erhobene Daten:</strong> Name, E-Mail-Adresse, Passwort (verschlüsselt), Bestellhistorie
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Ihre Rechte</h2>
            <p className="text-gray-700 mb-4">
              Sie haben jederzeit das Recht, Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten. Außerdem haben Sie das Recht auf Berichtigung, Löschung oder Einschränkung der Verarbeitung sowie ein Widerspruchsrecht gegen die Verarbeitung und das Recht auf Datenübertragbarkeit.
            </p>
            <p className="text-gray-700 mb-4">
              Bei Fragen zum Datenschutz können Sie sich jederzeit an uns wenden:
            </p>
            <p className="text-gray-700">
              E-Mail:{" "}
              <a
                href="mailto:bellabiladipizza@gmail.com"
                className="text-amber-600 hover:text-amber-700 hover:underline"
              >
                bellabiladipizza@gmail.com
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

