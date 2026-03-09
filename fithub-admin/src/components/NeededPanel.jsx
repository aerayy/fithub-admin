import { useNavigate } from "react-router-dom";

function Row({ label, count, desc, ctaLabel, onCta, muted }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <span
            className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              muted ? "bg-gray-100 text-gray-600" : count > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
            ].join(" ")}
          >
            {count}
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-600">{desc}</div>
      </div>

      <button
        onClick={onCta}
        className={[
          "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium",
          muted
            ? "cursor-not-allowed bg-gray-50 text-gray-400"
            : "bg-white text-gray-900 hover:bg-gray-50",
        ].join(" ")}
        disabled={muted}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

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
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Aksiyon Kutusu</div>
          <div className="mt-1 text-xs text-gray-600">
            Şu anda dikkatinizi gerektiren konular.
          </div>
        </div>

        <button
          onClick={refresh}
          className="rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50"
        >
          Yenile
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <Row
          label="Onay bekleyenler"
          count={loading ? "..." : pendingApprovalsCount}
          desc="Onayınızı bekleyen yeni satın almalar"
          ctaLabel="İncele"
          onCta={() => nav("/students?tab=new")}
        />

        <Row
          label="Okunmamış mesajlar"
          count={loading ? "..." : unreadMessagesCount}
          desc="Yanıt bekleyen öğrenci mesajları"
          ctaLabel="Sohbeti aç"
          onCta={() => nav("/messages")}
        />

        <Row
          label="Eksik antrenman programı"
          count={loading ? "..." : missingWorkoutList.length}
          desc="Aktif antrenman programı olmayan öğrenciler"
          ctaLabel="Program ata"
          onCta={() => nav("/students?tab=active")}
        />

        <Row
          label="Eksik beslenme programı"
          count={loading ? "..." : missingNutritionList.length}
          desc="Aktif beslenme programı olmayan öğrenciler"
          ctaLabel="Program ata"
          onCta={() => nav("/students?tab=active")}
        />

        <Row
          label="Onboarding tamamlanmamış"
          count={loading ? "..." : onboardingIncompleteList.length}
          desc="Program oluşturmak için profil verisi eksik öğrenciler"
          ctaLabel="Öğrencileri gör"
          onCta={() => nav("/students?tab=active")}
        />

        <Row
          label="Süresi dolmak üzere"
          count={loading ? "..." : endingSoonList.length}
          desc="7 gün içinde sona erecek abonelikler"
          ctaLabel="Öğrencileri gör"
          onCta={() => nav("/students?tab=active")}
        />
      </div>
    </div>
  );
}
