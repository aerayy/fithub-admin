import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const MOCK = [
  { id: "1", name: "Ahmet Yılmaz", goal: "Fat loss", status: "Active", updated: "Today" },
  { id: "2", name: "Ece Demir", goal: "Hypertrophy", status: "Active", updated: "2 days ago" },
  { id: "3", name: "Mert Kaya", goal: "Strength", status: "Paused", updated: "1 week ago" },
];

export default function Students() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MOCK;
    return MOCK.filter((x) => x.name.toLowerCase().includes(s) || x.goal.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="mt-1 text-sm text-gray-600">
            Öğrenci listesi (şimdilik mock data).
          </p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search student..."
          className="w-72 rounded-xl border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
        />
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
                key={r.id}
                onClick={() => nav(`/students/${r.id}`)}
                className="cursor-pointer border-t hover:bg-gray-50"
              >
                <td className="px-5 py-4 font-medium text-gray-900">{r.name}</td>
                <td className="px-5 py-4 text-gray-700">{r.goal}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      r.status === "Active"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-600">{r.updated}</td>
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
