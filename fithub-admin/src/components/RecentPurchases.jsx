const STATUS_STYLES = {
  pending: {
    text: "Beklemede",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  active: {
    text: "Aktif",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  approved: {
    text: "Onaylandı",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    text: "Reddedildi",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
  expired: {
    text: "Süresi Doldu",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  canceled: {
    text: "İptal",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
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
    <div className="rounded-[18px] border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)]">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
          <div>
            <h3 className="text-[18px] font-black tracking-tight text-[#0F172B] leading-none">
              Son Satın Alınan Paketler
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mt-1">
              Son 30 Gün
            </p>
          </div>
        </div>
        {!loading && items.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-[#3E9E8E]/10 text-[#2B7B6E] text-[12px] font-black">
            {items.length}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
            <div className="inline-block w-5 h-5 border-2 border-slate-200 border-t-[#3E9E8E] rounded-full animate-spin" />
            <p className="mt-2 text-xs font-semibold text-slate-500">Yükleniyor...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3E9E8E]/15 to-[#3E9E8E]/5 border border-[#3E9E8E]/10 mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1z" />
                <path d="M9 3v4M15 3v4" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">Henüz satın alma yok</p>
            <p className="text-xs text-slate-400 mt-1">Son 30 gün içinde kayıtlı satın alma bulunamadı</p>
          </div>
        ) : (
          items.map((item, i) => {
            const status = STATUS_STYLES[item.status] || {
              text: item.status,
              chip: "bg-slate-100 text-slate-600 border-slate-200",
              dot: "bg-slate-400",
            };
            return (
              <div
                key={item.subscription_id || i}
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(15,23,43,0.04)] transition-all"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-slate-200 bg-slate-100">
                  <img
                    src={
                      item.student_photo ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.student_id}`
                    }
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.student_id}`;
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#0F172B] truncate">
                    {item.student_name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 truncate">
                    {item.plan_name || "Paket"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.chip}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.text}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
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
