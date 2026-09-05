import React from "react";

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-cream/70 border-t border-gold-500/20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-full border border-gold-400 text-gold-300 font-display text-base pl-0.5">
              JW
            </span>
          <span className="font-display text-lg text-cream">Joalheria Autoral</span>
        </div>

        <p className="text-xs tracking-wide text-center">
          Joias exclusivas feitas à mão · &copy; {new Date().getFullYear()} JW Joalheria Autoral
        </p>

        <a
          href="https://www.instagram.com/janaynawaitejoias/"
          target="_blank"
          rel="noreferrer"
          className="text-sm uppercase tracking-widest text-gold-400 hover:text-gold-300 transition-colors"
        >
          Instagram
        </a>
      </div>
    </footer>
  );
}
