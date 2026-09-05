import React from "react";

export default function Marquee({
  items = ["JOIAS AUTORAIS", "DESIGN", "MATÉRIA", "IDENTIDADE", "JW"],
  className = "",
}) {
  return (
    <div
      className={`relative w-full overflow-hidden border-y border-gold-500/15 select-none ${className}`}
      aria-hidden="true"
    >
      <div
        className="
          relative mx-auto max-w-5xl overflow-hidden
          [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]
          [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]
        "
      >
        <div className="flex w-max animate-marquee">
          {[...items, ...items].map((item, index) => (
            <React.Fragment key={index}>
              <span className="shrink-0 px-3 py-4 text-xs uppercase tracking-[0.35em] text-cream/50 md:px-5 md:text-sm">
                {item}
              </span>

              <span className="shrink-0 py-4 text-xs text-gold-500/50">
                ·
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}