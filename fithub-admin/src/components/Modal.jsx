export default function Modal({ open, title, onClose, children }) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />
  
        {/* modal */}
        <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold">{title}</div>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
            >
              Close
            </button>
          </div>
  
          {children}
        </div>
      </div>
    );
  }
  