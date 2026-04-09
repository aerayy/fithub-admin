import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";

export default function SAStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast, ToastContainer } = useToast();

  const fetch = () => {
    api.get("/superadmin/students")
      .then((res) => setStudents(res.data?.students || []))
      .catch(() => showToast("Öğrenciler yüklenemedi", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const deleteUser = async (id, name) => {
    if (!window.confirm(`"${name}" hesabını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    try {
      await api.delete(`/superadmin/users/${id}`);
      showToast("Hesap silindi", "success");
      fetch();
    } catch (e) {
      showToast(e?.response?.data?.detail || "Silinemedi", "error");
    }
  };

  const filtered = search.trim()
    ? students.filter((s) => {
        const q = search.toLowerCase();
        return (s.full_name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q) || (s.coach_name || "").toLowerCase().includes(q);
      })
    : students;

  if (loading) return <div className="text-gray-500 text-sm">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Öğrenci Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} öğrenci kayıtlı</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsim, email veya koç ara..."
          className="w-64 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 outline-none focus:border-amber-500"
        />
      </div>

      <div className="rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-800/50 text-gray-400">
            <tr>
              <th className="px-5 py-3 font-medium">Öğrenci</th>
              <th className="px-5 py-3 font-medium">Koç</th>
              <th className="px-5 py-3 font-medium">Hedef</th>
              <th className="px-5 py-3 font-medium">Abonelik</th>
              <th className="px-5 py-3 font-medium">Kayıt</th>
              <th className="px-5 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.user_id} className="border-t border-gray-800 hover:bg-gray-800/30">
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{s.full_name || "—"}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </td>
                <td className="px-5 py-4 text-gray-300">{s.coach_name || <span className="text-gray-600">Yok</span>}</td>
                <td className="px-5 py-4 text-gray-300">{s.goal_type || "—"}</td>
                <td className="px-5 py-4">
                  {s.sub_status ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      s.sub_status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                      s.sub_status === "canceled" ? "bg-red-500/10 text-red-400" :
                      "bg-gray-700 text-gray-400"
                    }`}>
                      {s.sub_status === "active" ? "Aktif" : s.sub_status === "canceled" ? "İptal" : s.sub_status}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString("tr-TR") : "—"}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => deleteUser(s.user_id, s.full_name || s.email)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-600">Öğrenci bulunamadı.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ToastContainer />
    </div>
  );
}
