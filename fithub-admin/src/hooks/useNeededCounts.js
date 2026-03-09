import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export function useNeededCounts({ pollMs = 15000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setError("");
    try {
      const res = await api.get("/coach/dashboard/summary");
      setData(res.data);
    } catch (e) {
      console.error("Dashboard summary error:", e?.response?.status, e?.response?.data);
      setError(e?.response?.data?.detail || "Kontrol paneli verileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDashboard();
    if (!pollMs) return;
    const id = setInterval(fetchDashboard, pollMs);
    return () => clearInterval(id);
  }, [fetchDashboard, pollMs]);

  return useMemo(() => {
    const kpi = data?.kpi ?? {};
    const needed = data?.needed ?? {};
    return {
      coachName: data?.coach_name ?? "",
      pendingApprovalsCount: kpi.pending_approvals ?? 0,
      activeStudentsCount: kpi.active_students ?? 0,
      unreadMessagesCount: kpi.unread_messages ?? 0,
      endingSoonCount: kpi.ending_soon_count ?? 0,
      monthlyRevenue: kpi.monthly_revenue ?? 0,
      endingSoonList: needed.ending_soon ?? [],
      onboardingIncompleteList: needed.onboarding_incomplete ?? [],
      missingWorkoutList: needed.missing_workout ?? [],
      missingNutritionList: needed.missing_nutrition ?? [],
      recentActivity: data?.recent_activity ?? [],
      recentPurchases: data?.recent_purchases ?? [],
      loading,
      error,
      refresh: fetchDashboard,
    };
  }, [data, loading, error, fetchDashboard]);
}
