export default function RecentActivity() {
  const items = [
    "• 0 events (MVP placeholder)",
    "• Yakında: satın alma, onay, program güncelleme event’leri",
  ];

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">Recent activity</div>
      <div className="mt-1 text-xs text-gray-600">Son 10 olay (event based)</div>

      <div className="mt-4 space-y-2 text-sm text-gray-700">
        {items.map((x, i) => (
          <div key={i} className="rounded-xl border bg-white px-4 py-3 text-sm">
            {x}
          </div>
        ))}
      </div>
    </div>
  );
}
