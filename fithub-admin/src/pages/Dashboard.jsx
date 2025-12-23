import KpiCard from "../components/KpiCard";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          KPI’lar ve hızlı aksiyonlar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Students" value="24" sub="All active & past" />
        <KpiCard label="Active Programs" value="18" sub="Workout + Nutrition" />
        <KpiCard label="New Messages" value="5" sub="Last 24 hours" />
        <KpiCard label="Check-ins Due" value="7" sub="This week" />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-gray-900">Next steps</div>
        <ul className="mt-3 list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>Students sayfasında tablo + arama</li>
          <li>Öğrenci detayında onboarding alanlarını gösterme</li>
          <li>Programlar sekmesi (workout/nutrition)</li>
        </ul>
      </div>
    </div>
  );
}
