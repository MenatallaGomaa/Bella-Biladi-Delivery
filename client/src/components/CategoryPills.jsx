export default function CategoryPills({ tabs, active, onPick, sticky = false }) {
  return (
    <div className={`relative mt-6 ${sticky ? 'sticky top-0 z-30 bg-amber-200 pt-4 pb-2 -mx-3 px-3 shadow-md' : ''}`}>
      {/* Horizontal scroll container */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 pb-3 px-1 snap-x snap-mandatory">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onPick(tab)}
            className={`flex-shrink-0 snap-start px-4 py-2 rounded-md text-base font-medium transition-colors duration-200 whitespace-nowrap
              ${
                active === tab
                  ? "bg-white border border-gray-300 text-gray-900 shadow-sm"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Optional fading edges for a modern look */}
      <div className="pointer-events-none absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-amber-200 to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-amber-200 to-transparent" />
    </div>
  );
}
