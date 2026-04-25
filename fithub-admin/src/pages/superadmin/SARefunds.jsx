import { useEffect, useState } from "react";
import { api } from "../../lib/api";

/**
 * Bekleyen iade taleplerini listeler ve admin onayı sağlar.
 * Backend: /admin/refunds/pending (GET) ve /admin/refunds/{id}/approve (POST).
 * Auth: X-Admin-Key header (VITE_ADMIN_KEY).
 */
export default function SARefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const adminKey = import.meta.env.VITE_ADMIN_KEY || "";
  const headers = { "X-Admin-Key": adminKey };

  const fetchRefunds = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/refunds/pending", { headers });
      setRefunds(data?.refunds || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "İade talepleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleApprove = async (id) => {
    if (!confirm("Bu iade talebini onaylıyor musun? Para iadesi işleme alınacak.")) return;
    setProcessingId(id);
    try {
      await api.post(`/admin/refunds/${id}/approve`, {}, { headers });
      // Listeden kaldır
      setRefunds((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e?.response?.data?.detail || "Onaylama başarısız oldu.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">İade Talepleri</h1>
          <p className="text-sm text-gray-500 mt-1">
            {refunds.length === 0
              ? "Bekleyen iade talebi yok."
              : `${refunds.length} bekleyen talep`}
          </p>
        </div>
        <button
          onClick={fetchRefunds}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          Yenile
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {refunds.length > 0 && (
        <div className="rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="px-5 py-3 font-medium">Öğrenci</th>
                <th className="px-5 py-3 font-medium">Koç</th>
                <th className="px-5 py-3 font-medium">Paket</th>
                <th className="px-5 py-3 font-medium">Başlangıç</th>
                <th className="px-5 py-3 font-medium">Talep Tarihi</th>
                <th className="px-5 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="px-5 py-4">
                    <div className="text-white font-medium">{r.client_name || "—"}</div>
                    <div className="text-gray-500 text-xs">{r.client_email || "—"}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{r.coach_name || "—"}</td>
                  <td className="px-5 py-4 text-gray-300">{r.plan_name || "—"}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {r.started_at ? new Date(r.started_at).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {r.refund_requested_at
                      ? new Date(r.refund_requested_at).toLocaleString("tr-TR")
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={processingId === r.id}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === r.id ? "İşleniyor..." : "Onayla"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
