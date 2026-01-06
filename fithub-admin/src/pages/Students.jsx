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
      setStudents(data?.students || []);
    } catch (e) {
      console.error("Students fetch error:", e?.response?.status, e?.response?.data);
      setError(e?.response?.data?.detail || "Students yüklenemedi");
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
          {d === null ? "Active" : `Active · ${d}d left`}
        </span>
      );
    }

    if (tab === "new") {
      return (
        <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-gray-800">
          New{typeof r.days_ago === "number" ? ` · ${r.days_ago}d ago` : ""}
        </span>
      );
    }

    const isActive = !!r.is_active;
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {error ? <div className="text-red-600">{error}</div> : null}

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="mt-1 text-sm text-gray-600">Öğrenci listesi (API’den geliyor).</p>
        </div>

        <div className="flex items-center gap-2">
          <TabBtn id="all">All</TabBtn>
          <TabBtn id="active">Active</TabBtn>
          <TabBtn id="new">New purchases (7d)</TabBtn>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student..."
            className="ml-2 w-72 rounded-xl border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Goal</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Last update</th>
              {tab === "new" ? <th className="px-5 py-3 font-medium">Action</th> : null}
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
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {r.full_name || r.email}
                    <div className="text-xs font-normal text-gray-500">{r.email}</div>

                    {tab === "new" ? (
                      <div className="mt-1 text-xs font-normal text-gray-500">
                        Purchased: <span className="font-medium">{r.package_name || r.plan_name || "Package"}</span>
                        {typeof r.price === "number" ? ` • ₺${r.price}` : ""}
                        {typeof r.duration_days === "number" ? ` • ${r.duration_days} gün` : ""}
                      </div>
                    ) : null}

                    {r.plan_name ? (
                      <div className="mt-1 text-xs font-normal text-gray-500">
                        {r.plan_name} •{" "}
                        {r.subscription_status === "active" ? `${r.days_left} days left` : "expired"}
                      </div>
                    ) : null}
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
                          Approve
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
                          Reject
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
                  No students found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
