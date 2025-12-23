export default function ProgramCard({ title, subtitle, children, onEdit }) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
            ) : null}
          </div>
  
          <button
            onClick={onEdit}
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Edit
          </button>
        </div>
  
        <div className="mt-4">{children}</div>
      </div>
    );
  }
  