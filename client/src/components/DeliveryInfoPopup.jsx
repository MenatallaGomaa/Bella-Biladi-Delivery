import { useState, useEffect } from "react";

export default function DeliveryInfoPopup({ onClose, showAtCheckout = false }) {
  const [showPromotion, setShowPromotion] = useState(true);

  // Check if promotion is still active (until March 8th, 2026)
  const isPromotionActive = () => {
    const today = new Date();
    const promotionEndDate = new Date(2026, 2, 8); // March 8, 2026 (month is 0-indexed)
    return today <= promotionEndDate;
  };

  const promotionActive = isPromotionActive();

  const deliveryPricing = [
    {
      distance: "Bis 2 km",
      fee: "Gratis",
      minOrder: "ab 20€",
      description: "Bis 2 km gratis liefern ab 20€"
    },
    {
      distance: "Bis 4 km",
      fee: "2,99€",
      minOrder: "ab 20€",
      description: "Bis 4 km 2,99€ ab 20€"
    },
    {
      distance: "Bis 6 km",
      fee: "3,99€",
      minOrder: "ab 30€",
      description: "Bis 6 km 3,99€ ab 30€"
    },
    {
      distance: "Bis 8 km",
      fee: "4,99€",
      minOrder: "ab 75€",
      description: "Bis 8 km 4,99€ ab 75€"
    }
  ];

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
        <div className="sticky top-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold">Lieferinformationen</h2>
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
          {/* Promotional Message */}
          {showPromotion && promotionActive && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-800 mb-2 text-lg">
                    🎉 Aktionsangebot: 3 Monate kostenlose Lieferung!
                  </h3>
                  <p className="text-green-700 text-sm leading-relaxed">
                    In den ersten <strong className="font-bold">3 Monaten</strong> (bis zum 8. März 2026) liefern wir 
                    <strong className="font-semibold"> kostenlos bis 2 km</strong> von 
                    Probstheidaer Straße 21!
                  </p>
                  <p className="text-green-600 text-xs mt-2 italic">
                    * Mindestbestellwert: 20€
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Regular Pricing Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Lieferpreise
            </h3>
            <div className="space-y-3">
              {deliveryPricing.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-gray-50 border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {item.distance}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.minOrder}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-lg ${
                          item.fee === "Gratis"
                            ? "text-green-600"
                            : "text-gray-800"
                        }`}
                      >
                        {item.fee}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm">
              ℹ️ Wichtige Hinweise
            </h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Lieferung erfolgt von Probstheidaer Straße 21, 04277 Leipzig</li>
              <li>Die Entfernung wird automatisch berechnet</li>
              <li>Mindestbestellwert muss erreicht werden</li>
            </ul>
          </div>

          {/* Action Buttons */}
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

