import { useEffect } from "react";

export default function Modal({ open, title, onClose, children }) {
  // body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-3">
      {/* Click outside to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Modal arka planını kapat"
      />

      {/* Modal card */}
      <div
        className="
          relative mx-auto w-full max-w-5xl
          rounded-2xl bg-white shadow-xl
          max-h-[90vh] overflow-hidden
        "
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            type="button"
          >
            Kapat
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(90vh - 72px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
