import { euro } from "../api";

export function ProductCard({ item, onAdd }) {
  return (
    <div className="min-w-[220px] max-w-[240px] bg-white rounded-xl shadow p-3 snap-start">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt=""
          className="w-full h-28 object-cover rounded-lg"
        />
      )}
      <div className="mt-2 font-medium">{item.name}</div>
      <div className="text-xs text-slate-500 line-clamp-1">
        {item.description}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{euro(item.priceCents)}</div>
        <button
          onClick={() => onAdd(item._id)}
          className="text-xs px-2 py-1 rounded bg-orange-500 text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}
