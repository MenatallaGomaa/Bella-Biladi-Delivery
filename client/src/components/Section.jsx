import { forwardRef, useRef } from "react";
import { ProductCard } from "./ProductCard";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const Section = forwardRef(({ title, items, onAddToCart }, ref) => {
  const [sectionRef, isSectionVisible] = useScrollAnimation({ threshold: 0.1 });
  const scrollDirectionRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  return (
    <section ref={ref} className="mt-8">
      <h2
        ref={sectionRef}
        className={`text-xl font-bold mb-3 transition-all duration-500 ease-out ${
          isSectionVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-3"
        }`}
      >
        {title}
      </h2>

      {title === "Beliebt" ? (
        <div 
          className="flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory pb-2 items-stretch"
          style={{ touchAction: 'pan-x pan-y' }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
            scrollDirectionRef.current = null;
            const container = e.currentTarget;
            
            const handleTouchMove = (moveEvent) => {
              if (scrollDirectionRef.current) return; // Already determined direction
              
              const moveTouch = moveEvent.touches[0];
              const deltaX = Math.abs(moveTouch.clientX - touchStartRef.current.x);
              const deltaY = Math.abs(moveTouch.clientY - touchStartRef.current.y);
              
              // Determine scroll direction after 10px movement
              if (deltaX > 10 || deltaY > 10) {
                if (deltaY > deltaX) {
                  // Vertical scroll - allow page to scroll
                  scrollDirectionRef.current = 'vertical';
                  container.style.touchAction = 'pan-y';
                  container.style.overflowX = 'hidden';
                } else {
                  // Horizontal scroll - scroll the container
                  scrollDirectionRef.current = 'horizontal';
                  container.style.touchAction = 'pan-x';
                }
              }
            };
            
            const handleTouchEnd = () => {
              // Reset after touch ends
              setTimeout(() => {
                scrollDirectionRef.current = null;
                container.style.touchAction = 'pan-x pan-y';
                container.style.overflowX = 'auto';
              }, 100);
              
              container.removeEventListener('touchmove', handleTouchMove);
              container.removeEventListener('touchend', handleTouchEnd);
            };
            
            container.addEventListener('touchmove', handleTouchMove, { passive: true });
            container.addEventListener('touchend', handleTouchEnd);
          }}
        >
          {items.map((item, index) => {
            const cleanedName = item.name?.replace(/^Beliebte\s+/i, "") || item.name;
            return (
              <ProductCard
                key={item._id}
                item={{ ...item, name: cleanedName }}
                compact
                onAddToCart={onAddToCart}
              />
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <ProductCard
              key={item._id}
              item={item}
              onAddToCart={onAddToCart}
              delay={index * 30}
            />
          ))}
        </div>
      )}
    </section>
  );
});

export default Section;
