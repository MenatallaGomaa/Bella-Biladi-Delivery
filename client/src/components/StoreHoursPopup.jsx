import { isStoreOpen, getStoreHoursString } from "../utils/storeHours";

export default function StoreHoursPopup({ onClose }) {
  const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentDayName = dayNames[dayOfWeek];

  // Store hours configuration
  const STORE_HOURS = {
    0: { open: 11, close: 23 }, // Sunday
    1: { open: 11, close: 22 }, // Monday
    2: { open: 11, close: 22 }, // Tuesday
    3: { open: 11, close: 22 }, // Wednesday
    4: { open: 11, close: 22 }, // Thursday
    5: { open: 11, close: 22 }, // Friday
    6: { open: 11, close: 22 }, // Saturday
  };

  const formatTime = (hour) => `${hour.toString().padStart(2, '0')}:00`;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold">Geschlossen</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Schließen"
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Closed Message */}
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 mb-2 text-lg">
                  ⏰ Wir sind derzeit geschlossen
                </h3>
                <p className="text-red-700 text-sm leading-relaxed">
                  Leider können wir derzeit keine Lieferungen oder Abholungen entgegennehmen.
                  Bitte besuchen Sie uns während unserer Öffnungszeiten.
                </p>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <img src="/clock.png" alt="Clock" className="w-5 h-5" />
              Öffnungszeiten
            </h3>
            <div className="space-y-2">
              {Object.keys(STORE_HOURS).map((day) => {
                const dayNum = parseInt(day);
                const hours = STORE_HOURS[dayNum];
                const isToday = dayNum === dayOfWeek;
                
                return (
                  <div
                    key={day}
                    className={`flex justify-between items-center py-2 px-3 rounded ${
                      isToday ? "bg-amber-50 border-l-4 border-amber-500" : "bg-gray-50"
                    }`}
                  >
                    <span className={`font-medium ${isToday ? "text-amber-700" : "text-gray-700"}`}>
                      {dayNames[dayNum]}
                      {isToday && <span className="ml-2 text-xs text-amber-600">(Heute)</span>}
                    </span>
                    <span className={isToday ? "text-amber-700 font-semibold" : "text-gray-600"}>
                      {formatTime(hours.open)} - {formatTime(hours.close)} Uhr
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">
              ℹ️ Wichtige Hinweise
            </h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Letzte Bestellung: 15 Minuten vor Schließung (bis 21:45 Uhr)</li>
              <li>Bitte besuchen Sie uns später während der Öffnungszeiten</li>
              <li>Sie können bereits jetzt für später bestellen</li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full bg-amber-400 hover:bg-amber-500 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              Verstanden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

