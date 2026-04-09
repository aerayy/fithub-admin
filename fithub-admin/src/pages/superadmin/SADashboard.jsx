import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function KpiCard({ label, value, sub, color = "amber" }) {
  const colors = {
    amber: "border-amber-500/20 bg-amber-500/5",
    green: "border-emerald-500/20 bg-emerald-500/5",
    blue: "border-blue-500/20 bg-blue-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
  };
  const textColors = { amber: "text-amber-400", green: "text-emerald-400", blue: "text-blue-400", purple: "text-purple-400" };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-bold mt-2 ${textColors[color]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function SADashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/superadmin/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">Yükleniyor...</div>;
  if (!data) return <div className="text-red-400 text-sm">Dashboard yüklenemedi. SuperAdmin yetkisi gerekli.</div>;

  const u = data.users || {};
  const s = data.subscriptions || {};
  const c = data.content || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Sistem Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">FithubPoint genel bakış</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Toplam Öğrenci" value={u.total_clients || 0} sub={`+${u.new_this_week || 0} bu hafta`} color="blue" />
        <KpiCard label="Aktif Koç" value={c.active_coaches || 0} color="purple" />
        <KpiCard label="Aktif Abonelik" value={s.active || 0} sub={`${s.canceled_this_month || 0} iptal (30g)`} color="green" />
        <KpiCard label="Aylık Gelir" value={`₺${(s.monthly_revenue || 0).toLocaleString("tr-TR")}`} color="amber" />
      </div>

      {/* Secondary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Yeni Kayıt (30g)" value={u.new_this_month || 0} color="blue" />
        <KpiCard label="Toplam Koç" value={u.total_coaches || 0} color="purple" />
        <KpiCard label="Besin Veritabanı" value={c.total_foods || 0} sub="BeGreens + USDA" color="green" />
        <KpiCard label="Egzersiz Kütüphanesi" value={c.total_exercises || 0} color="amber" />
      </div>

      {/* Quick Info */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Sistem Bilgisi</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Backend</span>
            <span className="text-gray-300">Render (FastAPI)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Veritabanı</span>
            <span className="text-gray-300">PostgreSQL (Render)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dosya Depolama</span>
            <span className="text-gray-300">Cloudinary</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">AI Motor</span>
            <span className="text-gray-300">OpenAI GPT-4o-mini</span>
          </div>
        </div>
      </div>
    </div>
  );
}
