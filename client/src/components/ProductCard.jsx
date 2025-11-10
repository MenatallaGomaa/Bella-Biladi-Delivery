import { useEffect, useMemo, useState } from "react";
import { euro } from "../api";
import { useCart } from "../pages/CartContext";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const DIP_OPTIONS = [
  { id: "vegane-mayo", label: "Mit veganer Mayo" },
  { id: "bbq", label: "Mit BBQ-Dip" },
  { id: "knoblauch", label: "Mit Knoblauch-Dip" },
  { id: "kraeuter", label: "Mit Kräuter-Dip" },
  { id: "sweet-chili", label: "Mit Sweet-Chili-Dip" },
  { id: "ketchup", label: "Mit Ketchup" },
  { id: "mayonnaise", label: "Mit Mayonnaise" },
  { id: "ohne", label: "Ohne Dip" },
];

const CHEESE_OPTIONS = [
  { id: "klassisch", label: "Normaler Käse" },
  { id: "vegan", label: "Veganer Käse" },
  { id: "ohne", label: "Ohne Käse" },
];

const EXTRA_OPTIONS = [
  { id: "aubergine", label: "Aubergine", priceCents: 100 },
  { id: "tomaten", label: "Tomaten", priceCents: 100 },
  { id: "thunfisch", label: "Thunfisch", priceCents: 100 },
  { id: "cherrytomaten", label: "Cherrytomaten", priceCents: 100 },
  { id: "rinderhack", label: "Rinderhack", priceCents: 150 },
  { id: "basilikum", label: "Basilikum", priceCents: 100 },
  { id: "champignons", label: "Champignons", priceCents: 100 },
  { id: "haehnchenbrust", label: "Hähnchenbrust", priceCents: 150 },
  { id: "rote-zwiebeln", label: "Rote Zwiebeln", priceCents: 100 },
  { id: "prosciutto", label: "Prosciutto", priceCents: 150 },
  { id: "spinat", label: "Spinat", priceCents: 100 },
  { id: "brie", label: "Brie", priceCents: 150 },
  { id: "extra-kaese", label: "Extra Käse", priceCents: 150 },
  { id: "gorgonzola", label: "Gorgonzola", priceCents: 150 },
  { id: "chili", label: "Chili", priceCents: 100 },
  { id: "mozzarella", label: "Mozzarella", priceCents: 150 },
  { id: "zwiebeln", label: "Zwiebeln", priceCents: 100 },
  { id: "oliven", label: "Oliven", priceCents: 100 },
  { id: "emmentaler", label: "Emmentaler", priceCents: 150 },
  { id: "brokkoli", label: "Brokkoli", priceCents: 100 },
  { id: "paprika", label: "Paprika", priceCents: 100 },
  { id: "salami", label: "Salami", priceCents: 150 },
  { id: "mais", label: "Mais", priceCents: 100 },
];

export function ProductCard({ item, compact = false, delay = 0 }) {
  const { addToCart, lastAdded, isCartExpanded } = useCart();
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.1 });
  const [imageError, setImageError] = useState(false);
  const imageSrc = imageError || !item.imageUrl ? "/main.jpeg" : item.imageUrl;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDip, setSelectedDip] = useState(DIP_OPTIONS[0].id);
  const [selectedCheese, setSelectedCheese] = useState(CHEESE_OPTIONS[0].id);
  const [selectedExtras, setSelectedExtras] = useState(new Set());
  const [quantity, setQuantity] = useState(1);
  const [highlighted, setHighlighted] = useState(false);
  const [buttonPulse, setButtonPulse] = useState(false);

  const baseId = useMemo(
    () => item._id || item.id || item.name,
    [item._id, item.id, item.name]
  );

  useEffect(() => {
    if (lastAdded && lastAdded.baseItemId === baseId) {
      setHighlighted(true);
      setTimeout(() => setHighlighted(false), 3000);
    }
  }, [lastAdded, baseId]);

  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    document.body.style.overflow = "";
  }, [isModalOpen]);

  const handleImageError = () => {
    setImageError(true);
  };

  const { isPizza, isPizzaRoll, isDrink, isDessert } = useMemo(() => {
    const category = item.category?.toLowerCase() || "";
    const name = item.name?.toLowerCase() || "";

    const pizzaRollKeywords = ["pizzabrötchen", "pizza bun", "pizza roll", "pizzabröt"].some(
      (keyword) => name.includes(keyword)
    );

    const pizzaKeywords = ["pizza", "calzone"].some((keyword) =>
      name.includes(keyword)
    );

    const isRoll =
      category === "pizza rolls" ||
      (category === "popular" && pizzaRollKeywords);
    const isPizzaItem = category === "pizza" || (!isRoll && pizzaKeywords);
    const isDrinkItem = category === "drinks";
    const isDessertItem = category === "desserts";

    return { isPizza: isPizzaItem, isPizzaRoll: isRoll, isDrink: isDrinkItem, isDessert: isDessertItem };
  }, [item.category, item.name]);

  const resetCustomization = () => {
    setSelectedDip(DIP_OPTIONS[0].id);
    setSelectedCheese(CHEESE_OPTIONS[0].id);
    setSelectedExtras(new Set());
    setQuantity(1);
  };

  const handleAddClick = () => {
    // Don't allow adding items when cart is expanded
    if (isCartExpanded) {
      return;
    }
    
    if (isPizza || isPizzaRoll) {
      setIsModalOpen(true);
    } else {
      addToCart({ ...item, baseItemId: baseId });
    }
  };
  
  // Prevent modal from opening when cart is expanded
  useEffect(() => {
    if (isCartExpanded && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [isCartExpanded, isModalOpen]);

  const handleCardActivate = (event) => {
    if (
      event?.type === "keydown" &&
      !["Enter", " ", "Spacebar", "Space"].includes(event.key)
    ) {
      return;
    }
    event?.preventDefault?.();
    handleAddClick();
  };

  const handleButtonClick = (event) => {
    event.stopPropagation();
    handleAddClick();
  };

  const handleToggleExtra = (id) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const extrasList = EXTRA_OPTIONS.filter((extra) =>
      selectedExtras.has(extra.id)
    );
    const extrasPrice = extrasList.reduce((sum, extra) => sum + extra.priceCents, 0);

    const details = [];
    const customizations = {};

    if (isPizzaRoll) {
      const dipOption = DIP_OPTIONS.find((d) => d.id === selectedDip) || DIP_OPTIONS[0];
      customizations.dip = dipOption.label;
      details.push(`Dip: ${dipOption.label}`);
    }

    if (isPizza) {
      const cheeseOption =
        CHEESE_OPTIONS.find((c) => c.id === selectedCheese) || CHEESE_OPTIONS[0];
      customizations.cheese = cheeseOption.label;
      details.push(`Käse: ${cheeseOption.label}`);
    }

    if (extrasList.length > 0) {
      const extrasLabel = extrasList.map((extra) => extra.label).join(", ");
      customizations.extras = extrasList.map((extra) => ({
        label: extra.label,
        priceCents: extra.priceCents,
      }));
      details.push(`Extras: ${extrasLabel}`);
    }

    const detailSuffix = details.length ? ` – ${details.join(" | ")}` : "";

    const customItem = {
      ...item,
      name: `${item.name}${detailSuffix}`,
      description: item.description,
      priceCents: item.priceCents + extrasPrice,
      customizations,
      baseItemId: baseId,
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(customItem);
    }
    setIsModalOpen(false);
    resetCustomization();
  };

  useEffect(() => {
    if (lastAdded && lastAdded.id === baseId) {
      setHighlighted(true);
      setButtonPulse(true);
      const highlightTimer = setTimeout(() => setHighlighted(false), 600);
      const pulseTimer = setTimeout(() => setButtonPulse(false), 600);
      return () => {
        clearTimeout(highlightTimer);
        clearTimeout(pulseTimer);
      };
    }
  }, [lastAdded, baseId]);

  const closeModal = () => {
    setIsModalOpen(false);
    resetCustomization();
  };

  const renderModal = () => {
    if (!isModalOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        onClick={closeModal}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold">
              {isPizzaRoll ? "Pizzabrötchen anpassen" : "Pizza anpassen"}
            </h3>
            <button
              onClick={closeModal}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-5">
            {isPizzaRoll && (
              <div>
                <div className="text-sm font-medium text-gray-700">Dip auswählen</div>
                <div className="mt-3 space-y-2">
                  {DIP_OPTIONS.map((dip) => (
                    <label
                      key={dip.id}
                      className={`flex items-center justify-between rounded-xl border p-3 text-sm transition-colors ${
                        selectedDip === dip.id
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-200 hover:border-amber-200"
                      }`}
                    >
                      <span>{dip.label}</span>
                      <input
                        type="radio"
                        name="dip"
                        checked={selectedDip === dip.id}
                        onChange={() => setSelectedDip(dip.id)}
                        className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isPizza && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">Käse auswählen</div>
                  <div className="mt-3 space-y-2">
                    {CHEESE_OPTIONS.map((cheese) => (
                      <label
                        key={cheese.id}
                        className={`flex items-center justify-between rounded-xl border p-3 text-sm transition-colors ${
                          selectedCheese === cheese.id
                            ? "border-amber-400 bg-amber-50"
                            : "border-gray-200 hover:border-amber-200"
                        }`}
                      >
                        <span>{cheese.label}</span>
                        <input
                          type="radio"
                          name="cheese"
                          checked={selectedCheese === cheese.id}
                          onChange={() => setSelectedCheese(cheese.id)}
                          className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700">Extras hinzufügen</div>
                  <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1">
                    {EXTRA_OPTIONS.map((extra) => {
                      const checked = selectedExtras.has(extra.id);
                      return (
                        <label
                          key={extra.id}
                          className={`flex items-center justify-between rounded-xl border p-3 text-sm transition-colors ${
                            checked
                              ? "border-amber-400 bg-amber-50"
                              : "border-gray-200 hover:border-amber-200"
                          }`}
                        >
                          <div>
                            <div>{extra.label}</div>
                            <div className="text-xs text-gray-500">
                              {extra.priceCents / 100} €
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleExtra(extra.id)}
                            className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 rounded-full bg-amber-50 px-3 py-2 text-sm font-medium text-gray-700">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-7 w-7 rounded-full bg-white text-lg leading-none shadow hover:bg-amber-100"
                aria-label="Weniger"
              >
                −
              </button>
              <span className="w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="h-7 w-7 rounded-full bg-white text-lg leading-none shadow hover:bg-amber-100"
                aria-label="Mehr"
              >
                +
              </button>
            </div>
            <button
              onClick={() => {
                // Don't allow adding items when cart is expanded
                if (!isCartExpanded) {
                  handleConfirm();
                }
              }}
              disabled={isCartExpanded}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-black shadow ${
                isCartExpanded 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-amber-400 hover:bg-amber-500"
              }`}
            >
              Zum Warenkorb hinzufügen
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <>
        <div
          ref={ref}
          className={`relative min-w-[180px] bg-white shadow rounded-lg p-3 pb-2 snap-center transition-all duration-500 ease-out cursor-pointer ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          } ${highlighted ? "ring-2 ring-amber-400 shadow-lg" : ""}`}
          style={{ transitionDelay: `${delay}ms` }}
          role="button"
          tabIndex={0}
          onClick={handleCardActivate}
          onKeyDown={handleCardActivate}
        >
          {isDrink || isDessert ? (
            <div className="w-full h-28 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden">
              <img
                src={imageSrc}
                alt={item.name}
                className="max-w-full max-h-full object-contain"
                onError={handleImageError}
              />
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={item.name}
              className="w-full h-28 object-cover rounded-md"
              onError={handleImageError}
            />
          )}
          <div className="mt-2 font-medium">{item.name}</div>
          <div className="mt-1 font-semibold mb-1">{euro(item.priceCents)}</div>
          <button
            onClick={handleButtonClick}
            className={`absolute top-2 right-2 bg-white rounded-full p-1 shadow transition-colors ${
              buttonPulse ? "bg-amber-200 animate-pulse" : "hover:bg-amber-200"
            }`}
          >
            <img src="/plus.png" alt="add" className="w-5 h-5" />
          </button>
        </div>
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div
        ref={ref}
        className={`relative flex flex-col sm:flex-row sm:items-center gap-4 bg-white shadow rounded-lg p-4 h-full transition-all duration-500 ease-out cursor-pointer ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        } ${highlighted ? "ring-2 ring-amber-400 shadow-lg" : ""}`}
        style={{ transitionDelay: `${delay}ms` }}
        role="button"
        tabIndex={0}
        onClick={handleCardActivate}
        onKeyDown={handleCardActivate}
      >
        <div className="flex-1">
          <div className="font-medium text-base sm:text-lg">{item.name}</div>
          <div className="text-sm text-gray-500 mt-1 leading-relaxed max-h-16 overflow-hidden">
            {item.description}
          </div>
          <div className="mt-2 font-semibold text-lg text-amber-600">
            {euro(item.priceCents)}
          </div>
        </div>
        {isDrink || isDessert ? (
          <div className="w-full sm:w-28 h-36 sm:h-28 bg-gray-50 rounded-xl border border-amber-100 flex items-center justify-center overflow-hidden">
            <img
              src={imageSrc}
              alt={item.name}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
            />
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full sm:w-28 h-36 sm:h-28 object-cover rounded-xl border border-amber-100"
            onError={handleImageError}
          />
        )}
        <button
          onClick={handleButtonClick}
          className={`absolute top-3 right-3 bg-white rounded-full p-1.5 shadow transition-colors ${
            buttonPulse ? "bg-amber-200 animate-pulse" : "hover:bg-amber-200"
          }`}
        >
          <img src="/plus.png" alt="add" className="w-5 h-5" />
        </button>
      </div>
      {renderModal()}
    </>
  );
}
