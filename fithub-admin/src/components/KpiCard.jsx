export default function KpiCard({ label, value, sub }) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
        {sub ? <div className="mt-2 text-xs text-gray-500">{sub}</div> : null}
      </div>
    );
  }
  