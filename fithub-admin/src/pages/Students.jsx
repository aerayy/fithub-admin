import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Students() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // all | active | new
  const [tab, setTab] = useState("all");

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

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return students;

    return students.filter((x) => {
      const name = (x.full_name || "").toLowerCase();
      const goal = (x.goal_type || "").toLowerCase();
      const email = (x.email || "").toLowerCase();
      return name.includes(s) || goal.includes(s) || email.includes(s);
    });
  }, [q, students]);

  const TabBtn = ({ id, children }) => {
    const active = tab === id;
    return (
      <button
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
    // new-purchases -> purchased_at
    // all -> purchased_at
    // active -> ends_at (istersen)
    const d = r.purchased_at || r.started_at || r.created_at;
    return d ? new Date(d).toLocaleDateString() : "-";
  };

  const StatusPill = ({ r }) => {
    // active endpoint: days_left geliyor
    if (tab === "active") {
  const d = typeof r.days_left === "number" ? r.days_left : null;
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
      {d === null ? "Active" : `Active · ${d}d left`}
    </span>
  );
}


    // new purchases: days_ago geliyor
    if (tab === "new") {
      return (
        <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-gray-800">
          New
          {typeof r.days_ago === "number" ? ` · ${r.days_ago}d ago` : ""}
        </span>
      );
    }

    // all: is_active backendden geliyor (Adım 1 ile)
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
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
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
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr
                key={r.student_id}
                onClick={() => nav(`/students/${r.student_id}`)}
                className="cursor-pointer border-t hover:bg-gray-50"
              >
                <td className="px-5 py-4 font-medium text-gray-900">
  {r.full_name || r.email}
  <div className="text-xs font-normal text-gray-500">{r.email}</div>

  {r.plan_name ? (
    <div className="mt-1 text-xs font-normal text-gray-500">
      {r.plan_name} • {r.subscription_status === "active" ? `${r.days_left} days left` : "expired"}
    </div>
  ) : null}
</td>


                <td className="px-5 py-4 text-gray-700">{r.goal_type || "-"}</td>

                <td className="px-5 py-4">
                  <StatusPill r={r} />
                </td>

                <td className="px-5 py-4 text-gray-600">{getLastDate(r)}</td>
              </tr>
            ))}

            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-gray-500" colSpan={4}>
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
