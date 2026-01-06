import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export function useNeededCounts({ days = 7, pollMs = 15000 } = {}) {
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCounts = useCallback(async () => {
    setError("");

    try {
      // 1) Pending approvals (new purchases)
      const pendingReq = api.get(`/coach/students/new-purchases?days=${days}`);

      // 2) Active students
      const activeReq = api.get(`/coach/students/active`);

      const [pendingRes, activeRes] = await Promise.all([pendingReq, activeReq]);

      const pendingList = pendingRes?.data?.students || [];
      const activeList = activeRes?.data?.students || [];

      setPendingApprovalsCount(Array.isArray(pendingList) ? pendingList.length : 0);
      setActiveStudentsCount(Array.isArray(activeList) ? activeList.length : 0);
    } catch (e) {
      console.error("useNeededCounts error:", e?.response?.status, e?.response?.data);
      setError(e?.response?.data?.detail || "Counts fetch failed");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchCounts();

    if (!pollMs) return;

    const id = setInterval(fetchCounts, pollMs);
    return () => clearInterval(id);
  }, [fetchCounts, pollMs]);

  return useMemo(
    () => ({
      pendingApprovalsCount,
      activeStudentsCount,
      loading,
      error,
      refresh: fetchCounts,
    }),
    [pendingApprovalsCount, activeStudentsCount, loading, error, fetchCounts]
  );
}
