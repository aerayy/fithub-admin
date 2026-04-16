import { useNavigate } from "react-router-dom";

const SEVERITY_STYLES = {
  critical: {
    stripe: "bg-gradient-to-b from-rose-500 to-rose-600",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeDot: "bg-rose-500",
    iconBg: "from-rose-100 to-rose-50",
    iconBorder: "border-rose-100",
    iconStroke: "#E11D48",
  },
  warning: {
    stripe: "bg-gradient-to-b from-amber-500 to-amber-600",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeDot: "bg-amber-500",
    iconBg: "from-amber-100 to-amber-50",
    iconBorder: "border-amber-100",
    iconStroke: "#D97706",
  },
  info: {
    stripe: "bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]",
    badgeBg: "bg-[#3E9E8E]/10 text-[#2B7B6E] border-[#3E9E8E]/20",
    badgeDot: "bg-[#3E9E8E]",
    iconBg: "from-[#3E9E8E]/15 to-[#3E9E8E]/5",
    iconBorder: "border-[#3E9E8E]/15",
    iconStroke: "#3E9E8E",
  },
  clear: {
    stripe: "bg-slate-200",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeDot: "bg-emerald-500",
    iconBg: "from-emerald-100 to-emerald-50",
    iconBorder: "border-emerald-100",
    iconStroke: "#10B981",
  },
};

function severityFor(count, loading) {
  if (loading) return "info";
  if (count >= 5) return "critical";
  if (count >= 1) return "warning";
  return "clear";
}

function Row({ label, count, desc, ctaLabel, onCta, loading, icon }) {
  const sev = severityFor(count, loading);
  const s = SEVERITY_STYLES[sev];
  const dimmed = !loading && count === 0;

  return (
    <div
      className={`relative group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white pl-4 pr-3 py-3 hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(15,23,43,0.04)] transition-all overflow-hidden ${
        dimmed ? "opacity-75" : ""
      }`}
    >
      <div className={`absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full ${s.stripe}`} />

      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.iconBg} flex items-center justify-center flex-shrink-0 border ${s.iconBorder}`}
        >
          {icon(s.iconStroke)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-[#0F172B] truncate">{label}</div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${s.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.badgeDot}`} />
              {loading ? "..." : count}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-slate-500 truncate">{desc}</div>
        </div>
      </div>

      <button
        onClick={onCta}
        disabled={dimmed}
        className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-3 h-8 text-xs font-bold transition-all ${
          dimmed
            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
            : "bg-white border border-slate-200 text-[#0F172B] hover:bg-[#3E9E8E]/5 hover:border-[#3E9E8E]/30 hover:text-[#2B7B6E]"
        }`}
      >
        {ctaLabel}
        {!dimmed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </button>
    </div>
  );
}

const ICONS = {
  approvals: (stroke) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 5c0-1.66 4-3 9-3s9 1.34 9 3-4 3-9 3-9-1.34-9-3z" />
    </svg>
  ),
  messages: (stroke) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  workout: (stroke) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5l11 11" />
      <path d="M21 21l-1.5-1.5M2.5 2.5L4 4" />
      <path d="M14.5 6.5l-3 3M9.5 14.5l-3 3" />
      <path d="M18 3l3 3M3 18l3 3" />
    </svg>
  ),
  nutrition: (stroke) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z" />
      <path d="M21 15v7" />
    </svg>
  ),
  onboarding: (stroke) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  expiring: (stroke) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

export default function NeededPanel({
  pendingApprovalsCount,
  unreadMessagesCount,
  endingSoonList,
  onboardingIncompleteList,
  missingWorkoutList = [],
  missingNutritionList = [],
  loading,
  error,
  refresh,
}) {
  const nav = useNavigate();

  return (
    <div className="rounded-[18px] border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)]">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
          <div>
            <h3 className="text-[18px] font-black tracking-tight text-[#0F172B] leading-none">
              Aksiyon Kutusu
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mt-1">
              Dikkatinizi Gerektiren Konular
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          title="Yenile"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 h-9 text-xs font-bold text-[#0F172B] hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Yenile
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2.5">
        <Row
          label="Onay bekleyenler"
          count={pendingApprovalsCount || 0}
          desc="Onayınızı bekleyen yeni satın almalar"
          ctaLabel="İncele"
          onCta={() => nav("/students?tab=new")}
          loading={loading}
          icon={ICONS.approvals}
        />
        <Row
          label="Okunmamış mesajlar"
          count={unreadMessagesCount || 0}
          desc="Yanıt bekleyen öğrenci mesajları"
          ctaLabel="Sohbeti aç"
          onCta={() => nav("/messages")}
          loading={loading}
          icon={ICONS.messages}
        />
        <Row
          label="Eksik antrenman programı"
          count={missingWorkoutList.length}
          desc="Aktif antrenman programı olmayan öğrenciler"
          ctaLabel="Program ata"
          onCta={() => nav("/students?tab=active")}
          loading={loading}
          icon={ICONS.workout}
        />
        <Row
          label="Eksik beslenme programı"
          count={missingNutritionList.length}
          desc="Aktif beslenme programı olmayan öğrenciler"
          ctaLabel="Program ata"
          onCta={() => nav("/students?tab=active")}
          loading={loading}
          icon={ICONS.nutrition}
        />
        <Row
          label="Onboarding tamamlanmamış"
          count={onboardingIncompleteList.length}
          desc="Program oluşturmak için profil verisi eksik öğrenciler"
          ctaLabel="Öğrencileri gör"
          onCta={() => nav("/students?tab=active")}
          loading={loading}
          icon={ICONS.onboarding}
        />
        <Row
          label="Süresi dolmak üzere"
          count={endingSoonList.length}
          desc="7 gün içinde sona erecek abonelikler"
          ctaLabel="Öğrencileri gör"
          onCta={() => nav("/students?tab=active")}
          loading={loading}
          icon={ICONS.expiring}
        />
      </div>
    </div>
  );
}
