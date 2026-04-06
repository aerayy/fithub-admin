import { useState, useCallback, useRef } from "react";

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      if (timers.current[id]) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    }, 300);
  }, []);

  const showToast = useCallback(
    (message, variant = "info") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);
      timers.current[id] = setTimeout(() => dismiss(id), 3000);
      return id;
    },
    [dismiss]
  );

  function ToastContainer() {
    if (!toasts.length) return null;

    return (
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const base =
            "pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium max-w-sm transition-all duration-300";

          const colors =
            t.variant === "success"
              ? "bg-green-600 text-white"
              : t.variant === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-white";

          const animation = t.exiting
            ? "translate-x-full opacity-0"
            : "translate-x-0 opacity-100 animate-[slideIn_0.3s_ease-out]";

          const icon =
            t.variant === "success" ? (
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : t.variant === "error" ? (
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                />
              </svg>
            );

          return (
            <div key={t.id} className={`${base} ${colors} ${animation}`}>
              {icon}
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 ml-1 opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return { showToast, ToastContainer };
}
