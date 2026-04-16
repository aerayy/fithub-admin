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
    recentPurchases,
    loading,
    error,
    refresh,
  } = useNeededCounts({ pollMs: 15000 });

  const firstName = coachName ? coachName.split(" ")[0] : "";

  return (
    <div className="w-full space-y-6">
      {/* Welcome header */}
      <div className="flex items-start gap-3">
        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E] flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h1 className="text-[30px] font-black tracking-tight text-[#0F172B] leading-[1.1]">
            {loading ? "Kontrol Paneli" : `${getGreeting()}, ${firstName || "Koç"}`}
          </h1>
          {!loading && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3E9E8E]/10 text-[#2B7B6E] text-[11px] font-bold uppercase tracking-wider border border-[#3E9E8E]/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E9E8E] animate-pulse" />
                {activeStudentsCount} aktif öğrenci
              </span>
              {unreadMessagesCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 text-[11px] font-bold uppercase tracking-wider border border-fuchsia-200">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {unreadMessagesCount} okunmamış mesaj
                </span>
              )}
              {pendingApprovalsCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider border border-amber-200">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {pendingApprovalsCount} onay bekliyor
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          variant="revenue"
          label="Aylık Gelir"
          value={loading ? "..." : formatCurrency(monthlyRevenue)}
          sub="Aktif aboneliklerden"
        />
        <KpiCard
          variant="students"
          label="Aktif Öğrenciler"
          value={loading ? "..." : String(activeStudentsCount)}
          sub="Size atanmış"
        />
        <KpiCard
          variant="messages"
          label="Yeni Mesajlar"
          value={loading ? "..." : String(unreadMessagesCount)}
          sub="Öğrencilerden okunmamış"
        />
        <KpiCard
          variant="pending"
          label="Onay Bekleyenler"
          value={loading ? "..." : String(pendingApprovalsCount)}
          sub="Yeni satın almalar (7 gün)"
        />
        <KpiCard
          variant="expiring"
          label="Süresi Dolmak Üzere"
          value={loading ? "..." : String(endingSoonCount)}
          sub="7 gün içinde"
        />
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
