import KpiCard from "../components/KpiCard";
import NeededPanel from "../components/NeededPanel";
import RecentActivity from "../components/RecentActivity";
import { useNeededCounts } from "../hooks/useNeededCounts";

export default function Dashboard() {
  // KPI’larda 2 tanesi gerçek data olsun diye burada da kullanıyoruz.
  const { pendingApprovalsCount, activeStudentsCount, loading } = useNeededCounts({
    days: 7,
    pollMs: 15000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">KPI’lar ve hızlı aksiyonlar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pending approvals"
          value={loading ? "…" : String(pendingApprovalsCount)}
          sub="New purchases (7 days)"
        />
        <KpiCard
          label="Active students"
          value={loading ? "…" : String(activeStudentsCount)}
          sub="Has active package"
        />
        <KpiCard label="New Messages" value="0" sub="Coming soon" />
        <KpiCard label="Check-ins Due" value="0" sub="Coming soon" />
      </div>

      {/* KPI kartlarının altına 2 kolon */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NeededPanel />
        <RecentActivity />
      </div>
    </div>
  );
}
