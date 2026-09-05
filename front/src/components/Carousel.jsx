import React, { useRef, useState, useEffect, Children } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Carrossel horizontal simples (scroll-snap), sem dependências externas.
// Usado apenas no mobile — no desktop os depoimentos aparecem em grid (ver Home.jsx).
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
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="flex absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-full items-center justify-center w-9 h-9 rounded-full bg-forest-900 text-gold-400 border border-gold-500/30 hover:border-gold-400 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
            className="flex absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full items-center justify-center w-9 h-9 rounded-full bg-forest-900 text-gold-400 border border-gold-500/30 hover:border-gold-400 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Próximo"
          >
            <ChevronRight size={18} />
          </button>

          <div className="flex justify-center gap-1.5 mt-4">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-5 bg-gold-500" : "w-1.5 bg-gold-500/30"
                }`}
                aria-label={`Ir para item ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}