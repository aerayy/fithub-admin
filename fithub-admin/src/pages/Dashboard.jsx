import KpiCard from "../components/KpiCard";
import NeededPanel from "../components/NeededPanel";
import RecentPurchases from "../components/RecentPurchases";
import { useNeededCounts } from "../hooks/useNeededCounts";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

function formatCurrency(value) {
  if (!value) return "0 TL";
  return value.toLocaleString("tr-TR") + " TL";
}

export default function Dashboard() {
  const {
    coachName,
    pendingApprovalsCount,
    activeStudentsCount,
    unreadMessagesCount,
    endingSoonCount,
    monthlyRevenue,
    endingSoonList,
    onboardingIncompleteList,
    missingWorkoutList,
    missingNutritionList,
    recentActivity,
    recentPurchases,
    loading,
    error,
    refresh,
  } = useNeededCounts({ pollMs: 15000 });

  const firstName = coachName ? coachName.split(" ")[0] : "";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {loading ? "Kontrol Paneli" : `${getGreeting()}, ${firstName || "Koç"}`}
        </h1>
        {!loading && (
          <p className="mt-1 text-sm text-gray-600">
            {activeStudentsCount} aktif öğrenci
            {unreadMessagesCount > 0 && ` \u00B7 ${unreadMessagesCount} okunmamış mesaj`}
            {pendingApprovalsCount > 0 && ` \u00B7 ${pendingApprovalsCount} onay bekleyen`}
          </p>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Aylık Gelir"
          value={loading ? "..." : formatCurrency(monthlyRevenue)}
          sub="Aktif aboneliklerden"
        />
        <KpiCard
          label="Aktif Öğrenciler"
          value={loading ? "..." : String(activeStudentsCount)}
          sub="Size atanmış"
        />
        <KpiCard
          label="Yeni Mesajlar"
          value={loading ? "..." : String(unreadMessagesCount)}
          sub="Öğrencilerden okunmamış"
        />
        <KpiCard
          label="Onay Bekleyenler"
          value={loading ? "..." : String(pendingApprovalsCount)}
          sub="Yeni satın almalar (7 gün)"
        />
        <KpiCard
          label="Süresi Dolmak Üzere"
          value={loading ? "..." : String(endingSoonCount)}
          sub="7 gün içinde"
        />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NeededPanel
          pendingApprovalsCount={pendingApprovalsCount}
          activeStudentsCount={activeStudentsCount}
          unreadMessagesCount={unreadMessagesCount}
          endingSoonList={endingSoonList}
          onboardingIncompleteList={onboardingIncompleteList}
          missingWorkoutList={missingWorkoutList}
          missingNutritionList={missingNutritionList}
          loading={loading}
          error={error}
          refresh={refresh}
        />
        <RecentPurchases items={recentPurchases} loading={loading} />
      </div>
    </div>
  );
}
