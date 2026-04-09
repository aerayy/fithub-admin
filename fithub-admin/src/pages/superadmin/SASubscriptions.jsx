import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function SASubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/superadmin/subscriptions")
      .then((res) => setSubs(res.data?.subscriptions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">Yükleniyor...</div>;

  const statusColors = {
    active: "bg-emerald-500/10 text-emerald-400",
    canceled: "bg-red-500/10 text-red-400",
    expired: "bg-gray-700 text-gray-400",
    pending: "bg-amber-500/10 text-amber-400",
  };
  const statusLabels = { active: "Aktif", canceled: "İptal", expired: "Süresi Dolmuş", pending: "Beklemede" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Abonelik Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">Son 100 abonelik</p>
      </div>

      <div className="rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400">
            <tr>
              <th className="px-5 py-3 font-medium">Öğrenci</th>
              <th className="px-5 py-3 font-medium">Koç</th>
              <th className="px-5 py-3 font-medium">Paket</th>
              <th className="px-5 py-3 font-medium">Fiyat</th>
              <th className="px-5 py-3 font-medium">Durum</th>
              <th className="px-5 py-3 font-medium">Başlangıç</th>
              <th className="px-5 py-3 font-medium">Bitiş</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                <td className="px-5 py-4 text-white font-medium">{s.client_name || "—"}</td>
                <td className="px-5 py-4 text-gray-300">{s.coach_name || "—"}</td>
                <td className="px-5 py-4 text-gray-300">{s.plan_name || "—"}</td>
                <td className="px-5 py-4 text-gray-300">{s.price != null ? `₺${Number(s.price).toLocaleString("tr-TR")}` : "—"}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[s.status] || "bg-gray-700 text-gray-400"}`}>
                    {statusLabels[s.status] || s.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">{s.started_at ? new Date(s.started_at).toLocaleDateString("tr-TR") : "—"}</td>
                <td className="px-5 py-4 text-gray-500 text-xs">{s.ends_at ? new Date(s.ends_at).toLocaleDateString("tr-TR") : "—"}</td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-600">Abonelik bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
