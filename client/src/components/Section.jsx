/*export default function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}*/

export default function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-3">{title}</h2>

      {/* Scrollable container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {children}
        </div>
      </div>
    </section>
  );
}
