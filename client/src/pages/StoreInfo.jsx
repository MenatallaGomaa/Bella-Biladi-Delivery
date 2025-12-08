import { useState } from "react";

export default function StoreInfo({ onNavigate }) {
  const [selectedImage, setSelectedImage] = useState(null);

  // Store interior images - using encodeURI to handle spaces in filenames
  const galleryImages = [
    { id: 1, url: encodeURI("/store 1 .jpeg"), alt: "Bella Biladi Store Interior 1" },
    { id: 2, url: encodeURI("/store 2 .jpeg"), alt: "Bella Biladi Store Interior 2" },
    { id: 3, url: encodeURI("/store 3 .jpeg"), alt: "Bella Biladi Store Interior 3" },
    { id: 4, url: encodeURI("/store 4 .jpeg"), alt: "Bella Biladi Store Interior 4" },
    { id: 5, url: encodeURI("/store 5 .jpeg"), alt: "Bella Biladi Store Interior 5" },
    { id: 6, url: encodeURI("/store 6 .jpeg"), alt: "Bella Biladi Store Interior 6" },
    { id: 7, url: encodeURI("/store 7.jpeg"), alt: "Bella Biladi Store Interior 7" },
    { id: 8, url: encodeURI("/store 8 .jpeg"), alt: "Bella Biladi Store Interior 8" },
  ];

  // Opening hours - Daily from 11:00 to 22:00
  const openingHours = [
    { day: "Montag", hours: "11:00 - 22:00" },
    { day: "Dienstag", hours: "11:00 - 22:00" },
    { day: "Mittwoch", hours: "11:00 - 22:00" },
    { day: "Donnerstag", hours: "11:00 - 22:00" },
    { day: "Freitag", hours: "11:00 - 22:00" },
    { day: "Samstag", hours: "11:00 - 22:00" },
    { day: "Sonntag", hours: "11:00 - 22:00" },
  ];

  return (
    <div className="min-h-screen bg-amber-200 pb-6">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Store Info</h1>
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
          <p className="text-gray-600">
            Erfahren Sie mehr über Bella Biladi - unsere Öffnungszeiten, unsere
            Räumlichkeiten und mehr.
          </p>
        </div>

        {/* Opening Hours Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img src="/clock.png" alt="Clock" className="w-6 h-6" />
            <h2 className="text-2xl font-bold text-gray-800">Öffnungszeiten</h2>
          </div>
          <div className="space-y-2">
            {openingHours.map((schedule, index) => {
              const isToday =
                new Date()
                  .toLocaleDateString("de-DE", { weekday: "long" })
                  .toLowerCase() === schedule.day.toLowerCase();
              return (
                <div
                  key={index}
                  className={`flex justify-between items-center py-2 px-3 rounded ${
                    isToday ? "bg-amber-50 border-l-4 border-amber-500" : ""
                  }`}
                >
                  <span
                    className={`font-medium ${
                      isToday ? "text-amber-700" : "text-gray-700"
                    }`}
                  >
                    {schedule.day}
                    {isToday && (
                      <span className="ml-2 text-xs text-amber-600">(Heute)</span>
                    )}
                  </span>
                  <span
                    className={`${
                      isToday ? "text-amber-700 font-semibold" : "text-gray-600"
                    }`}
                  >
                    {schedule.hours}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gallery Section - Horizontal Scrollable */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Unsere Räumlichkeiten
          </h2>
          <p className="text-gray-600 mb-4">
            Entdecken Sie unsere gemütliche Pizzeria und die Atmosphäre, die
            Bella Biladi ausmacht.
          </p>
          {/* Horizontal Scrollable Gallery */}
          <div className="relative">
            <div 
              className="overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6"
              style={{ 
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                {galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative flex-shrink-0 w-64 sm:w-80 h-64 sm:h-80 cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Failed to load image: ${image.url}`);
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg">Bild nicht verfügbar</div>';
                        }
                      }}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Scroll hint - only show on mobile/tablet */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
              <svg
                className="w-6 h-6 text-gray-400 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Weitere Informationen
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Adresse</h3>
              <p className="text-gray-600">
                Probstheidaer Straße 21<br />
                04277 Leipzig, Germany
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Kontakt</h3>
              <p className="text-gray-600">
                Telefon:{" "}
                <a
                  href="tel:+4915213274837"
                  className="text-amber-600 hover:text-amber-700 hover:underline"
                >
                  01521 3274837
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Lieferung</h3>
              <p className="text-gray-600">
                Wir liefern frische Pizzen direkt zu Ihnen nach Hause. Bestellen
                Sie jetzt online!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
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
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

