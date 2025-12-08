export default function AGB({ onNavigate }) {
  return (
    <div className="min-h-screen bg-amber-200 pb-6">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Allgemeine Geschäftsbedingungen (AGB)</h1>
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
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Geltungsbereich</h2>
            <p className="text-gray-700 mb-4">
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen von Speisen und Getränken über die Online-Plattform von BellaBiladi. Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, ihrer Geltung wird ausdrücklich schriftlich zugestimmt.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Vertragspartner</h2>
            <p className="text-gray-700 mb-2">
              Vertragspartner für alle Bestellungen ist:
            </p>
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
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Vertragsabschluss</h2>
            <p className="text-gray-700 mb-4">
              Mit der Bestellung gibt der Kunde ein verbindliches Angebot auf Abschluss eines Kaufvertrags ab. Die Bestätigung der Bestellung durch BellaBiladi stellt die Annahme des Angebots dar. Der Vertrag kommt mit der Bestätigung der Bestellung zustande.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Preise und Zahlungsbedingungen</h2>
            <p className="text-gray-700 mb-2">
              <strong>4.1 Preise</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Alle Preise verstehen sich in Euro inklusive der gesetzlichen Mehrwertsteuer. Die Preise können sich ändern. Maßgeblich ist der zum Zeitpunkt der Bestellung gültige Preis.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>4.2 Lieferkosten</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Die Lieferkosten werden bei der Bestellung angezeigt und sind abhängig von der Entfernung zur Lieferadresse. Es gelten die zum Zeitpunkt der Bestellung gültigen Lieferkosten.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>4.3 Zahlungsarten</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Die Zahlung erfolgt bei Lieferung in bar oder per Karte. Vorkasse ist nicht möglich.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Lieferung</h2>
            <p className="text-gray-700 mb-2">
              <strong>5.1 Liefergebiet</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Die Lieferung erfolgt innerhalb des angegebenen Liefergebiets. Die genauen Liefergebiete und -zeiten werden auf der Website angezeigt.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>5.2 Lieferzeit</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Die Lieferzeit beträgt in der Regel 30-45 Minuten. Abweichungen sind möglich und werden dem Kunden mitgeteilt. BellaBiladi ist bemüht, die angegebenen Lieferzeiten einzuhalten, kann jedoch keine Garantie dafür übernehmen.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>5.3 Mindestbestellwert</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Es gilt ein Mindestbestellwert von 20,00 €. Bestellungen unter diesem Wert können nicht aufgegeben werden.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">6. Widerrufsrecht</h2>
            <p className="text-gray-700 mb-4">
              Bei der Lieferung von Speisen und Getränken, die nach Kundenspezifikation angefertigt werden oder schnell verderblich sind, besteht kein Widerrufsrecht gemäß § 312g Abs. 2 Nr. 1 BGB. Dies gilt auch für andere Waren, die nicht für eine Rücksendung geeignet sind oder schnell verderben können.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">7. Gewährleistung und Haftung</h2>
            <p className="text-gray-700 mb-2">
              <strong>7.1 Gewährleistung</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Für Mängel an den gelieferten Speisen gelten die gesetzlichen Bestimmungen. Bei offensichtlichen Mängeln ist der Kunde verpflichtet, diese unverzüglich zu melden.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>7.2 Haftung</strong>
            </p>
            <p className="text-gray-700 mb-4">
              BellaBiladi haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach Maßgabe des Produkthaftungsgesetzes. Bei leichter Fahrlässigkeit haftet BellaBiladi nur bei Verletzung einer wesentlichen Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrages überhaupt erst ermöglicht.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">8. Datenschutz</h2>
            <p className="text-gray-700 mb-4">
              Der Umgang mit personenbezogenen Daten des Kunden erfolgt in Übereinstimmung mit der Datenschutzerklärung, die auf der Website einsehbar ist.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">9. Schlussbestimmungen</h2>
            <p className="text-gray-700 mb-2">
              <strong>9.1 Anwendbares Recht</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.
            </p>
            <p className="text-gray-700 mb-2">
              <strong>9.2 Salvatorische Klausel</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, so bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

