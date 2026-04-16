const THEMES = {
  revenue: {
    iconBg: "from-[#3E9E8E]/15 to-[#3E9E8E]/5",
    iconBorder: "border-[#3E9E8E]/15",
    iconStroke: "#3E9E8E",
    ring: "bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]",
  },
  students: {
    iconBg: "from-blue-100 to-blue-50",
    iconBorder: "border-blue-100",
    iconStroke: "#2563EB",
    ring: "bg-gradient-to-b from-blue-500 to-blue-600",
  },
  messages: {
    iconBg: "from-fuchsia-100 to-fuchsia-50",
    iconBorder: "border-fuchsia-100",
    iconStroke: "#C026D3",
    ring: "bg-gradient-to-b from-fuchsia-500 to-fuchsia-600",
  },
  pending: {
    iconBg: "from-amber-100 to-amber-50",
    iconBorder: "border-amber-100",
    iconStroke: "#D97706",
    ring: "bg-gradient-to-b from-amber-500 to-amber-600",
  },
  expiring: {
    iconBg: "from-rose-100 to-rose-50",
    iconBorder: "border-rose-100",
    iconStroke: "#E11D48",
    ring: "bg-gradient-to-b from-rose-500 to-rose-600",
  },
  neutral: {
    iconBg: "from-slate-100 to-slate-50",
    iconBorder: "border-slate-200",
    iconStroke: "#475569",
    ring: "bg-gradient-to-b from-slate-400 to-slate-500",
  },
};

const ICONS = {
  revenue: (stroke) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  students: (stroke) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  messages: (stroke) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  pending: (stroke) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  expiring: (stroke) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  neutral: (stroke) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

export default function KpiCard({ label, value, sub, variant = "neutral" }) {
  const theme = THEMES[variant] || THEMES.neutral;
  const iconRender = ICONS[variant] || ICONS.neutral;

  return (
    <div className="group relative rounded-[18px] border border-slate-100 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,43,0.06),0_12px_32px_rgba(15,23,43,0.06)] transition-shadow overflow-hidden">
      <div className={`absolute top-4 bottom-4 left-0 w-[3px] rounded-r-full ${theme.ring} opacity-70`} />

      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center flex-shrink-0 border ${theme.iconBorder}`}>
          {iconRender(theme.iconStroke)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</div>
          <div className="mt-1.5 text-[26px] font-black tracking-tight text-[#0F172B] leading-none truncate">
            {value}
          </div>
          {sub ? (
            <div className="mt-1.5 text-[11px] font-medium text-slate-400 truncate">{sub}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
