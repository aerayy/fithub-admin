const EVENT_CONFIG = {
  new_message: { icon: "\uD83D\uDCAC", label: "Yeni mesaj:" },
  new_purchase: { icon: "\uD83D\uDED2", label: "Yeni satın alma:" },
  subscription_approved: { icon: "\u2705", label: "Abonelik onaylandı:" },
  program_assigned: { icon: "\uD83D\uDCCB", label: "Program atandı:" },
};

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  const days = Math.floor(hrs / 24);
  return `${days}g önce`;
}

export default function RecentActivity({ items = [], loading }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">Son Aktiviteler</div>
      <div className="mt-1 text-xs text-gray-600">Son 10 olay</div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-400">
            Yükleniyor...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-white px-4 py-3 text-sm text-gray-400">
            Henüz aktivite yok.
          </div>
        ) : (
          items.map((item, i) => {
            const cfg = EVENT_CONFIG[item.event_type] || { icon: "\uD83D\uDCCC", label: "" };
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm"
              >
                <span className="mt-0.5 text-base">{cfg.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-gray-900">
                    <span className="font-medium">{cfg.label}</span>{" "}
                    {item.actor_name}
                  </div>
                  {item.detail && (
                    <div className="mt-0.5 truncate text-xs text-gray-500">
                      {item.detail}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {timeAgo(item.event_at)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
