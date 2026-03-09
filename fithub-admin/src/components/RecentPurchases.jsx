const STATUS_LABELS = {
  pending: { text: "Beklemede", color: "bg-yellow-100 text-yellow-700" },
  active: { text: "Aktif", color: "bg-green-100 text-green-700" },
  approved: { text: "Onaylandı", color: "bg-green-100 text-green-700" },
  rejected: { text: "Reddedildi", color: "bg-red-100 text-red-700" },
  expired: { text: "Süresi Doldu", color: "bg-gray-100 text-gray-500" },
};

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RecentPurchases({ items = [], loading }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">Son Satın Alınan Paketler</div>
      <div className="mt-1 text-xs text-gray-600">Son 30 gün</div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-400">
            Yükleniyor...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-400">
            Henüz satın alma yok.
          </div>
        ) : (
          items.map((item, i) => {
            const status = STATUS_LABELS[item.status] || { text: item.status, color: "bg-gray-100 text-gray-500" };
            return (
              <div
                key={item.subscription_id || i}
                className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm"
              >
                <img
                  src={item.student_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.student_id}`}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.student_id}`; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900">{item.student_name}</div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {item.plan_name || "Paket"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.text}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(item.purchased_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
