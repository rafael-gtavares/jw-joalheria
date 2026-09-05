import React from "react";

export default function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/5521999079400"
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com a Janayna no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-forest-700 hover:bg-forest-600 text-cream px-4 py-3 rounded-full shadow-lg shadow-black/30 transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.93L2 22l5.32-1.39a9.9 9.9 0 0 0 4.72 1.2h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.13.11-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.37-.14-.19-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.77-.36.19 0 .39 0 .55.01.18.01.41-.07.64.49.24.58.81 2.01.88 2.16.07.15.11.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.37-.41.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.89 1.05.93 1.94 1.22 2.22 1.36.28.14.44.12.61-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.1 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
      </svg>
      <span className="hidden sm:inline text-sm font-medium">Falar com Janayna</span>
    </a>
  );
}
