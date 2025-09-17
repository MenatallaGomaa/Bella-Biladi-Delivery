export default function CategoryPills({ tabs, active, onPick }) {
  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onPick(t)}
          className={`text-sm px-3 py-1 rounded border ${
            active === t ? "bg-amber-200 border-amber-300" : "bg-white"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
