import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";

export default function SACoaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastContainer } = useToast();

  const fetch = () => {
    api.get("/superadmin/coaches")
      .then((res) => setCoaches(res.data?.coaches || []))
      .catch(() => showToast("Koçlar yüklenemedi", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const toggleActive = async (id) => {
    try {
      const res = await api.patch(`/superadmin/coaches/${id}/toggle-active`);
      showToast(res.data.is_active ? "Koç aktifleştirildi" : "Koç pasifleştirildi", "success");
      fetch();
    } catch { showToast("İşlem başarısız", "error"); }
  };

  if (loading) return <div className="text-gray-500 text-sm">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Koç Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">{coaches.length} koç kayıtlı</p>
      </div>

      <div className="rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400">
            <tr>
              <th className="px-5 py-3 font-medium">Koç</th>
              <th className="px-5 py-3 font-medium">Öğrenci</th>
              <th className="px-5 py-3 font-medium">Aktif Abo</th>
              <th className="px-5 py-3 font-medium">Gelir</th>
              <th className="px-5 py-3 font-medium">Puan</th>
              <th className="px-5 py-3 font-medium">Durum</th>
              <th className="px-5 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((c) => (
              <tr key={c.user_id} className="border-t border-gray-800 hover:bg-gray-800/30">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                        {(c.full_name || "?")[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">{c.full_name || c.email}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-300">{c.student_count || 0}</td>
                <td className="px-5 py-4 text-gray-300">{c.active_sub_count || 0}</td>
                <td className="px-5 py-4 text-gray-300">₺{(c.revenue || 0).toLocaleString("tr-TR")}</td>
                <td className="px-5 py-4 text-gray-300">{c.rating ? `${c.rating} (${c.rating_count})` : "—"}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {c.is_active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleActive(c.user_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${c.is_active ? "border border-red-500/30 text-red-400 hover:bg-red-500/10" : "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"}`}
                  >
                    {c.is_active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ToastContainer />
    </div>
  );
}
