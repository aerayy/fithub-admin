import { useNavigate } from "react-router-dom";
import { useNeededCounts } from "../hooks/useNeededCounts";

function Row({ label, count, desc, ctaLabel, onCta, muted }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <span
            className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              muted ? "bg-gray-100 text-gray-600" : "bg-gray-900 text-white",
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

export default function NeededPanel() {
  const nav = useNavigate();
  const { pendingApprovalsCount, activeStudentsCount, loading, error, refresh } =
    useNeededCounts({ days: 7, pollMs: 15000 });

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Needed (Action Inbox)</div>
          <div className="mt-1 text-xs text-gray-600">
            Kritik aksiyonlar. Öncelik: satın alma onayı ve aktif öğrenci durumu.
          </div>
        </div>

        <button
          onClick={refresh}
          className="rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <Row
          label="Pending approvals"
          count={loading ? "…" : pendingApprovalsCount}
          desc="Yeni satın almalar — koç onayı bekliyor"
          ctaLabel="Go to New purchases"
          onCta={() => nav("/students?tab=new")}
          muted={false}
        />

        <Row
          label="Active students"
          count={loading ? "…" : activeStudentsCount}
          desc="Aktif paketi olan öğrenciler"
          ctaLabel="View active"
          onCta={() => nav("/students?tab=active")}
          muted={false}
        />

        <Row
          label="Check-ins overdue"
          count={0}
          desc="7+ gündür check-in yok (coming soon)"
          ctaLabel="Coming soon"
          onCta={() => {}}
          muted
        />

        <Row
          label="Onboarding incomplete"
          count={0}
          desc="Program yazmak için kritik veri eksik (coming soon)"
          ctaLabel="Coming soon"
          onCta={() => {}}
          muted
        />

        <Row
          label="Ending soon"
          count={0}
          desc="Aboneliği 7 gün içinde bitecekler (coming soon)"
          ctaLabel="Coming soon"
          onCta={() => {}}
          muted
        />
      </div>
    </div>
  );
}
