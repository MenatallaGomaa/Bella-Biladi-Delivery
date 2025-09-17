export default function CategoryPills({ tabs, active, onPick }) {
  return (
    <div className="flex gap-3 mt-6 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onPick(tab)}
          className={`px-4 py-2 rounded-md text-base font-medium transition-colors duration-200
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
  );
}
