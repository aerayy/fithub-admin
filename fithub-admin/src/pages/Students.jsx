import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Students() {
  const nav = useNavigate();
  const loc = useLocation();

  const [q, setQ] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // all | active | new
  const [tab, setTab] = useState("all");

  // ✅ URL ?tab=new gibi gelirse otomatik tab seç
  useEffect(() => {
    const p = new URLSearchParams(loc.search);
    const t = p.get("tab");
    if (t === "new" || t === "active" || t === "all") setTab(t);
  }, [loc.search]);

  const fetchStudents = async (nextTab) => {
    setLoading(true);
    setError("");

    try {
      let url = "/coach/students/all";
      if (nextTab === "active") url = "/coach/students/active";
      if (nextTab === "new") url = "/coach/students/new-purchases?days=7";

      const { data } = await api.get(url);
      console.log("[Students] API response sample:", data?.students?.[0]);
      setStudents(data?.students || []);
    } catch (e) {
      console.error("Students fetch error:", e?.response?.status, e?.response?.data);
      setError(e?.response?.data?.detail || "Öğrenciler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const decideSubscription = async ({ studentId, subscriptionId, decision }) => {
    setError("");
    try {
      const url =
        decision === "approve"
          ? `/coach/students/${studentId}/subscriptions/${subscriptionId}/approve`
          : `/coach/students/${studentId}/subscriptions/${subscriptionId}/reject`;

      await api.post(url);

      // New tab açıkken listeden düşsün
      await fetchStudents("new");
    } catch (e) {
      console.error("Decision error:", e?.response?.status, e?.response?.data);
      setError(e?.response?.data?.detail || "İşlem başarısız");
    }
  };

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return students;

    return students.filter((x) => {
      const name = (x.full_name || "").toLowerCase();
      const goal = (x.goal_type || "").toLowerCase();
      const email = (x.email || "").toLowerCase();
      const pkg = (x.package_name || x.plan_name || "").toLowerCase();
      return name.includes(s) || goal.includes(s) || email.includes(s) || pkg.includes(s);
    });
  }, [q, students]);

  const TabBtn = ({ id, children }) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className={`rounded-xl px-3 py-2 text-sm border ${
          active ? "bg-black text-white border-black" : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        {children}
      </button>
    );
  };

  const getLastDate = (r) => {
    const d = r.purchased_at || r.started_at || r.created_at;
    return d ? new Date(d).toLocaleDateString() : "-";
  };

  const StatusPill = ({ r }) => {
    if (tab === "active") {
      const d = typeof r.days_left === "number" ? r.days_left : null;
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          {d === null ? "Aktif" : `Aktif · ${d} gün kaldı`}
        </span>
      );
    }

    if (tab === "new") {
      return (
        <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-gray-800">
          Yeni{typeof r.days_ago === "number" ? ` · ${r.days_ago} gün önce` : ""}
        </span>
      );
    }

    // Use actual status field from API
    const status = r.status || r.subscription_status || "";
    const statusLower = status.toLowerCase();
    
    // Map status to display
    if (statusLower === "active") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          Aktif
        </span>
      );
    } else if (statusLower === "expired") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
          Süresi Dolmuş
        </span>
      );
    } else if (statusLower === "pending") {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
          Beklemede
        </span>
      );
    } else if (statusLower === "canceled" || statusLower === "rejected") {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          Pasif
        </span>
      );
    } else {
      // Fallback: use is_active if status is not available
      const isActive = !!r.is_active;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {isActive ? "Aktif" : "Pasif"}
        </span>
      );
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      {error ? <div className="text-red-600">{error}</div> : null}

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Öğrenciler</h1>
          <p className="mt-1 text-sm text-gray-600">Öğrenci listesi.</p>
        </div>

        <div className="flex items-center gap-2">
          <TabBtn id="all">Tümü</TabBtn>
          <TabBtn id="active">Aktif</TabBtn>
          <TabBtn id="new">Yeni satın almalar (7g)</TabBtn>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Öğrenci ara..."
            className="ml-2 w-72 rounded-xl border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3 font-medium">Öğrenci</th>
              <th className="px-5 py-3 font-medium">Hedef</th>
              <th className="px-5 py-3 font-medium">Durum</th>
              <th className="px-5 py-3 font-medium">Son güncelleme</th>
              {tab === "new" ? <th className="px-5 py-3 font-medium">İşlem</th> : null}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              // ✅ backend artık subscription_id gönderiyor (yoksa fallback)
              const subId = r.subscription_id ?? r.id ?? null;

              return (
                <tr
                  key={r.student_id}
                  onClick={() => nav(`/students/${r.student_id}`)}
                  className="cursor-pointer border-t hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.student_id || r.id}`}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.student_id || r.id}`; }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{r.full_name || r.email}</div>
                        <div className="text-xs font-normal text-gray-500">{r.email}</div>

                    {tab === "new" ? (
                      <div className="mt-1 text-xs font-normal text-gray-500">
                        Satın alınan: <span className="font-medium">{r.package_name || r.plan_name || "Paket"}</span>
                        {typeof r.price === "number" ? ` • ₺${r.price}` : ""}
                        {typeof r.duration_days === "number" ? ` • ${r.duration_days} gün` : ""}
                      </div>
                    ) : null}

                    {/* Show package/plan name only, no status inference */}
                    {(r.plan_name || r.package_name) && tab !== "new" ? (
                      <div className="mt-1 text-xs font-normal text-gray-500">
                        {r.package_name || r.plan_name}
                      </div>
                    ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-gray-700">{r.goal_type || "-"}</td>

                  <td className="px-5 py-4">
                    <StatusPill r={r} />
                  </td>

                  <td className="px-5 py-4 text-gray-600">{getLastDate(r)}</td>

                  {tab === "new" ? (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-40"
                          disabled={!subId}
                          onClick={(e) => {
                            e.stopPropagation();
                            decideSubscription({ studentId: r.student_id, subscriptionId: subId, decision: "approve" });
                          }}
                        >
                          Onayla
                        </button>

                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50 disabled:opacity-40"
                          disabled={!subId}
                          onClick={(e) => {
                            e.stopPropagation();
                            decideSubscription({ studentId: r.student_id, subscriptionId: subId, decision: "reject" });
                          }}
                        >
                          Reddet
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-gray-500" colSpan={tab === "new" ? 5 : 4}>
                  Öğrenci bulunamadı.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
