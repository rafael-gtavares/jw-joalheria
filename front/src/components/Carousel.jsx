import React, { useRef, useState, useEffect, Children } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Carrossel horizontal simples (scroll-snap), sem dependências externas.
// Usado apenas no mobile — no desktop os itens aparecem em grid (ver Home.jsx).
export default function Carousel({ children, itemClassName = "" }) {
  const trackRef = useRef(null);
  const items = Children.toArray(children);
  const [activeIndex, setActiveIndex] = useState(0);

  function scrollToIndex(index) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    const child = track.children[clamped];
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, children: kids } = track;
    let closest = 0;
    let closestDist = Infinity;
    Array.from(kids).forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft - scrollLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="relative md:hidden">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, i) => (
          <div key={i} className={`snap-start shrink-0 ${itemClassName}`}>
            {child}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="text-ink disabled:opacity-25 disabled:cursor-not-allowed p-1"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} strokeWidth={1.25} />
          </button>

          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={`h-px transition-all duration-300 ${
                  i === activeIndex ? "w-8 bg-ink" : "w-4 bg-ink/25"
                }`}
                aria-label={`Ir para item ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
            className="text-ink disabled:opacity-25 disabled:cursor-not-allowed p-1"
            aria-label="Próximo"
          >
            <ChevronRight size={18} strokeWidth={1.25} />
          </button>
        </div>
      )}
    </div>
  );
}
