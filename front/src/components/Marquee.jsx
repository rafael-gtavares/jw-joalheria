import React from "react";

export default function Marquee({
  items = ["JOIAS AUTORAIS", "PRATA 950", "OURO 18K", "FEITO À MÃO", "JW"],
  className = "",
}) {
  return (
    <div
      className={`relative w-full overflow-hidden border-y border-line select-none ${className}`}
      aria-hidden="true"
    >
      <div className="flex w-max animate-marquee">
        {[...items, ...items, ...items, ...items].map((item, index) => (
          <span
            key={index}
            className="shrink-0 px-8 py-5 text-[11px] uppercase tracking-[0.4em] text-stone"
          >
            {item}
            <span className="ml-16 text-brass">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
