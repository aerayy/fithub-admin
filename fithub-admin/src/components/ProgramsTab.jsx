import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProgramCard from "./ProgramCard";
import Modal from "./Modal";
import WorkoutEditor from "./WorkoutEditor";
import NutritionEditor from "./NutritionEditor";
import CardioEditor from "./CardioEditor";
import { api } from "../lib/api";

const DAY_LABELS = [
  ["mon", "Pzt"],
  ["tue", "Sal"],
  ["wed", "Çar"],
  ["thu", "Per"],
  ["fri", "Cum"],
  ["sat", "Cmt"],
  ["sun", "Paz"],
];

/* ---------------- UI helpers ---------------- */

function MiniList({ title, lines }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-gray-700">
        {lines?.length ? (
          lines.map((x, i) => (
            <li key={i} className="leading-5">
              • {x}
            </li>
          ))
        ) : (
          <li className="text-gray-500">Öğe yok</li>
        )}
      </ul>
    </div>
  );
}

function formatWorkoutLineFlat(x) {
  const base = `${x?.name || "İsimsiz"} ${x?.sets || 0}x${x?.reps || ""}`.trim();
  return x?.notes ? `${base} • ${x.notes}` : base;
}

/* ---------------- Workout: structured model ----------------
WorkoutEditor’ın beklediği shape (gördüğün UI’ya göre):
week[dayKey] = {
  title, kcal, coach_note,
  warmup: { duration_min, items: [...] },
  blocks: [{ title, items:[ {type:"exercise"...} | {type:"superset", items:[...] } ] }]
}
------------------------------------------------------------- */

function emptyStructuredWeek() {
  return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };
}

// Helper to normalize week structure (similar to WorkoutEditor's normalizeInitialWeek)
// Handles both old format (arrays) and new format (structured day objects)
function normalizeWeekForEditor(week) {
  if (!week || typeof week !== "object") return emptyStructuredWeek();
  
  const normalized = {};
  for (const [k] of DAY_LABELS) {
    const dayValue = week[k];
    if (Array.isArray(dayValue)) {
      // Old format: array of exercises -> convert to structured
      normalized[k] = ensureStructuredDay({
        blocks: [{
          title: "Antrenman Bloğu",
          items: dayValue.map((ex) => ({
            type: "exercise",
            name: ex?.name || "",
            sets: ex?.sets || 0,
            reps: ex?.reps || "",
            notes: ex?.notes || "",
          })),
        }],
      });
    } else if (dayValue && typeof dayValue === "object") {
      // New format: already structured
      normalized[k] = ensureStructuredDay(dayValue);
    } else {
      normalized[k] = null;
    }
  }
  return normalized;
}

function ensureStructuredDay(existing) {
  // existing varsa merge etmeye çalış (bozma)
  const base = {
    title: "",
    kcal: "",
    coach_note: "",
    scheduled_time: "",
    warmup: { duration_min: "", items: [] },
    blocks: [{ title: "Antrenman Bloğu", items: [] }],
  };
  if (!existing || typeof existing !== "object") return base;

  return {
    ...base,
    ...existing,
    warmup: {
      ...base.warmup,
      ...(existing.warmup || {}),
      items: Array.isArray(existing?.warmup?.items) ? existing.warmup.items : [],
    },
    blocks: Array.isArray(existing?.blocks) && existing.blocks.length
      ? existing.blocks.map((b) => ({
          title: b?.title ?? "Antrenman Bloğu",
          items: Array.isArray(b?.items) ? b.items : [],
        }))
      : base.blocks,
  };
}

// Summary: structured day -> lines
function flattenStructuredDayToLines(day) {
  if (!day) return [];

  const lines = [];

  // warmup items
  for (const it of day?.warmup?.items ?? []) {
    if (!it) continue;
    const name = it?.name || it?.exercise_name;
    if (!name) continue;
    const sets = it?.sets ?? 0;
    const reps = it?.reps ?? "";
    const notes = it?.notes ?? "";
    const base = `${name} ${sets}x${reps}`.trim();
    lines.push(notes ? `${base} • ${notes}` : base);
  }

  // blocks
  for (const b of day?.blocks ?? []) {
    for (const it of b?.items ?? []) {
      if (!it) continue;

      if (it?.type === "exercise") {
        const base = `${it?.name || "İsimsiz"} ${it?.sets ?? 0}x${it?.reps ?? ""}`.trim();
        lines.push(it?.notes ? `${base} • ${it.notes}` : base);
        continue;
      }

      if (it?.type === "superset") {
        for (const s of it?.items ?? []) {
          if (!s) continue;
          const base = `${s?.name || "İsimsiz"} ${s?.sets ?? 0}x${s?.reps ?? ""}`.trim();
          lines.push(`[Süperset] ${s?.notes ? `${base} • ${s.notes}` : base}`);
        }
      }
    }
  }

  return lines;
}

function workoutSummaryCardsStructured(week) {
  return DAY_LABELS.map(([k, label]) => {
    const day = week?.[k];
    const timeStr = day?.scheduled_time ? ` ${day.scheduled_time}` : "";
    return {
      key: k,
      title: `${label}${timeStr}`,
      lines: flattenStructuredDayToLines(day),
    };
  }).filter((d) => d.lines.length > 0);
}

/* ---------------- Backend -> UI mappers ---------------- */

function normalizeDayKey(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (s.startsWith("mon")) return "mon";
  if (s.startsWith("tue")) return "tue";
  if (s.startsWith("wed")) return "wed";
  if (s.startsWith("thu")) return "thu";
  if (s.startsWith("fri")) return "fri";
  if (s.startsWith("sat")) return "sat";
  if (s.startsWith("sun")) return "sun";
  return null;
}

// Eğer backend active_programs içinde direkt week gibi json dönerse onu kullan,
// yoksa workout_days + workout_exercises üzerinden structured üret.
function mapWorkoutFromActivePrograms(activePrograms) {
  // 1) Direkt week varsa (bazı implementasyonlarda olabilir)
  const maybeWeek =
    activePrograms?.workout_program?.week ||
    activePrograms?.workout_week ||
    null;

  if (maybeWeek && typeof maybeWeek === "object") {
    const w = emptyStructuredWeek();
    for (const [k] of DAY_LABELS) {
      if (maybeWeek[k]) w[k] = ensureStructuredDay(maybeWeek[k]);
    }
    return w;
  }

  // 2) Legacy tablolardan üret
  const week = emptyStructuredWeek();

  const days = activePrograms?.workout_days ?? [];
  const exs = activePrograms?.workout_exercises ?? [];

  const dayIdToKey = new Map();
  for (const d of days) {
    const id = d?.id;
    const key = normalizeDayKey(d?.day_of_week);
    if (id != null && key) dayIdToKey.set(id, key);
  }

  for (const e of exs) {
    const dayId = e?.workout_day_id ?? null;
    const key = dayIdToKey.get(dayId) || null;
    if (!key) continue;

    if (!week[key]) week[key] = ensureStructuredDay(null);

    // her günün ilk block’una yaz
    const day = ensureStructuredDay(week[key]);
    if (!Array.isArray(day.blocks) || !day.blocks.length) {
      day.blocks = [{ title: "Antrenman Bloğu", items: [] }];
    }
    if (!Array.isArray(day.blocks[0].items)) day.blocks[0].items = [];

    day.blocks[0].items.push({
      type: "exercise",
      name: e?.exercise_name ?? "İsimsiz",
      sets: e?.sets ?? 0,
      reps: e?.reps ?? "",
      notes: e?.notes ?? "",
    });

    week[key] = day;
  }

  return week;
}

/** Backend'den gelen content: string array veya item object array (besin + makro) olabilir */
function parseNutritionContentToItems(content) {
  if (!content) return [];
  if (Array.isArray(content)) {
    return content.map((x) => {
      if (x != null && typeof x === "object" && !Array.isArray(x)) return x;
      return typeof x === "string" ? x : String(x);
    });
  }
  const s = String(content).trim();
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parseNutritionContentToItems(parsed);
    } catch {}
  }
  if (s.includes("\n")) return s.split("\n").map((x) => x.trim()).filter(Boolean);
  if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean);
  return [s];
}

function nutritionItemToLine(item) {
  if (item != null && typeof item === "object" && "grams" in item) {
    const name = item.name_tr || item.name_en || "Besin";
    const g = item.grams ?? 0;
    const kcal = item.calories ?? 0;
    return `${name} ${g}g • ${kcal} kcal`;
  }
  return String(item ?? "");
}

function mapNutritionFromActivePrograms(activePrograms) {
  const meals = activePrograms?.meals ?? [];
  const dayWeek = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

  const normalized = meals
    .slice()
    .sort((a, b) => (a?.order_index ?? 9999) - (b?.order_index ?? 9999))
    .map((m) => ({
      type: m?.meal_type ?? "Meal",
      time: m?.time ?? "",
      items: parseNutritionContentToItems(m?.content),
    }));

  for (const [k] of DAY_LABELS) dayWeek[k] = normalized;
  return dayWeek;
}

function nutritionSummaryCards(week, dayKey = "mon") {
  const meals = week?.[dayKey] ?? [];
  return meals.slice(0, 3).map((m, idx) => {
    const timeStr = m?.time ? ` ${m.time}` : "";
    const lines = (m.items ?? []).map(nutritionItemToLine).filter(Boolean);
    return {
      key: `${m.type}-${idx}`,
      title: `${m.type}${timeStr}`,
      lines,
    };
  });
}

/* ---------------- Component ---------------- */

export default function ProgramsTab() {
  const { id } = useParams();
  const studentId = id;

  const [open, setOpen] = useState(null); // null | "workout" | "nutrition"
  const [selectedDay, setSelectedDay] = useState("mon");

  const [activePrograms, setActivePrograms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  // Latest workout program (always displayed in card)
  const [latestWorkoutProgram, setLatestWorkoutProgram] = useState(null); // { program_id, week, generated_by? }
  // Active workout program ID (only for badge check)
  const [activeWorkoutProgramId, setActiveWorkoutProgramId] = useState(null);
  const [workoutSource, setWorkoutSource] = useState(null); // "ai" | null
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null); // Error message for page banner
  const [generateSuccess, setGenerateSuccess] = useState(false); // Success message flag
  const [nutritionGenerating, setNutritionGenerating] = useState(false);
  const [nutritionGenerateError, setNutritionGenerateError] = useState(null);
  const [nutritionGenerateSuccess, setNutritionGenerateSuccess] = useState(false);
  const [showMacroInputs, setShowMacroInputs] = useState(false);
  const [targetMacros, setTargetMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [latestNutritionProgram, setLatestNutritionProgram] = useState(null);
  const [activeNutritionProgramId, setActiveNutritionProgramId] = useState(null);
  const [nutritionSource, setNutritionSource] = useState(null);
  const [nutritionWeek, setNutritionWeek] = useState(() => ({
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
  }));

  // Cardio program state
  const [cardioSessions, setCardioSessions] = useState([]);
  const [cardioSource, setCardioSource] = useState(null);
  const [activeCardioProgramId, setActiveCardioProgramId] = useState(null);
  const [latestCardioProgram, setLatestCardioProgram] = useState(null);
  const [showCardioEditor, setShowCardioEditor] = useState(false);

  const fetchActive = async () => {
    if (!studentId) return;
    setLoading(true);
    setLoadErr("");
    try {
      const res = await api.get(`/coach/students/${studentId}/active-programs`);
      setActivePrograms(res.data);

      // Extract active workout program ID (only for badge check, not for card content)
      const activeWorkoutId = 
        res.data?.workout_program?.id ||
        res.data?.workout_program?.program_id ||
        null;
      setActiveWorkoutProgramId(activeWorkoutId);

      const activeNutritionId = res.data?.nutrition_program?.id || null;
      setActiveNutritionProgramId(activeNutritionId);

      if (res.data?.cardio_program) {
        setActiveCardioProgramId(res.data.cardio_program.id);
      }
    } catch (e) {
      setLoadErr(e?.response?.data?.detail || e?.message || "Aktif programlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Fetch the latest saved workout program (this is what the card displays)
  const fetchLatestWorkout = async () => {
    if (!studentId) return;
    try {
      const res = await api.get(`/coach/students/${studentId}/workout-programs/latest`);
      if (res.data?.week) {
        const normalizedWeek = normalizeWeekForEditor(res.data.week);
        setLatestWorkoutProgram({
          program_id: res.data?.program_id || null,
          week: normalizedWeek,
          generated_by: res.data?.generated_by || res.data?.source || null,
        });
        // Check if it's AI-generated from response (support both field names)
        if (res.data?.generated_by === "ai" || res.data?.source === "ai") {
          setWorkoutSource("ai");
        } else {
          setWorkoutSource(null);
        }
      }
    } catch (e) {
      // 404 is expected if no workout exists, ignore it
      if (e?.response?.status !== 404) {
        console.error("Latest workout fetch error:", e);
      }
    }
  };

  const fetchLatestNutrition = async () => {
    if (!studentId) return;
    try {
      const res = await api.get(`/coach/students/${studentId}/nutrition-programs/latest`);
      if (res.data?.week) {
        setLatestNutritionProgram({
          program_id: res.data?.program_id || null,
          week: res.data.week,
          generated_by: res.data?.generated_by || null,
          supplements: res.data?.supplements || [],
        });
        setNutritionWeek(res.data.week);
        setNutritionSource(res.data?.generated_by === "ai" ? "ai" : null);
      }
    } catch (e) {
      if (e?.response?.status !== 404) {
        console.error("Latest nutrition fetch error:", e);
      }
    }
  };

  const fetchLatestCardio = async () => {
    if (!studentId) return;
    try {
      const res = await api.get(`/coach/students/${studentId}/cardio-programs/latest`);
      if (res.data?.program_id) {
        setLatestCardioProgram(res.data);
        setCardioSessions(res.data.sessions || []);
        setCardioSource(res.data.is_active ? 'active' : 'latest');
        if (res.data.is_active) setActiveCardioProgramId(res.data.program_id);
      }
    } catch (e) {
      if (e?.response?.status !== 404) {
        console.error("Latest cardio fetch error:", e);
      }
    }
  };

  useEffect(() => {
    fetchActive();
    fetchLatestWorkout();
    fetchLatestNutrition();
    fetchLatestCardio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // Card always displays latest workout program (regardless of active status)
  const displayWorkoutWeek = useMemo(() => {
    return latestWorkoutProgram?.week || emptyStructuredWeek();
  }, [latestWorkoutProgram]);

  // Active badge: check if latest program is the active one
  const isLatestProgramActive =
    latestWorkoutProgram?.program_id &&
    activeWorkoutProgramId &&
    latestWorkoutProgram.program_id === activeWorkoutProgramId;

  const isLatestNutritionActive =
    latestNutritionProgram?.program_id &&
    activeNutritionProgramId &&
    latestNutritionProgram.program_id === activeNutritionProgramId;

  const hasNutritionAnyData =
    latestNutritionProgram?.week &&
    Object.values(latestNutritionProgram.week).some(meals => meals && meals.length > 0);

  const workoutCards = useMemo(() => workoutSummaryCardsStructured(displayWorkoutWeek), [displayWorkoutWeek]);
  const nutritionCards = useMemo(
    () => nutritionSummaryCards(nutritionWeek, selectedDay),
    [nutritionWeek, selectedDay]
  );

  const hasWorkoutAnyData =
    Object.values(displayWorkoutWeek || {}).some((day) => flattenStructuredDayToLines(day).length > 0);

  const hasNutritionProgram = hasNutritionAnyData;

  async function saveWorkoutToBackend(week, { assign = false } = {}) {
    await api.post(`/coach/students/${studentId}/workout-programs`, { week });
  
    if (assign) {
      await api.post(`/coach/students/${studentId}/workout-programs/assign`);
    }
  }
  

  const generateWorkoutWithAI = async () => {
    if (!studentId || generating) return;
    
    setGenerating(true);
    setGenerateError(null);
    setGenerateSuccess(false);
    
    try {
      const res = await api.post(`/coach/students/${studentId}/workout-programs/generate`, {});
      
      // Update latest workout program directly from response (immediate UI update)
      if (res.data?.week) {
        const normalizedWeek = normalizeWeekForEditor(res.data.week);
        setLatestWorkoutProgram({
          program_id: res.data?.program_id || null,
          week: normalizedWeek,
          generated_by: res.data?.generated_by || res.data?.source || null,
        });
        
        // Mark as AI-generated if indicated in response
        if (res.data?.generated_by === "ai" || res.data?.source === "ai") {
          setWorkoutSource("ai");
        }
      }
      
      // Refetch from backend to ensure consistency
      await fetchLatestWorkout();
      
      // Refetch active programs to update active ID (for badge check)
      await fetchActive();
      
      // Show success message
      setGenerateSuccess(true);
      setTimeout(() => {
        setGenerateSuccess(false);
      }, 3000);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "AI antrenman programı oluşturulamadı";
      setGenerateError(msg);
      console.error("AI generation failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const generateNutritionWithAI = async () => {
    if (!studentId || nutritionGenerating) return;

    const { calories, protein, carbs, fat } = targetMacros;
    if (!calories || !protein || !carbs || !fat) {
      setNutritionGenerateError("Lütfen tüm makro değerlerini girin.");
      return;
    }

    setNutritionGenerating(true);
    setNutritionGenerateError(null);
    setNutritionGenerateSuccess(false);

    try {
      const res = await api.post(`/coach/students/${studentId}/nutrition-programs/generate`, {
        target_calories: Number(calories),
        target_protein: Number(protein),
        target_carbs: Number(carbs),
        target_fat: Number(fat),
      });

      if (res.data?.week) {
        setNutritionWeek(res.data.week);
        setLatestNutritionProgram({
          program_id: res.data?.program_id || null,
          week: res.data.week,
          generated_by: res.data?.generated_by || "ai",
          supplements: res.data?.supplements || [],
        });
        setNutritionSource("ai");
      }

      await Promise.all([fetchLatestNutrition(), fetchActive()]);
      setNutritionGenerateSuccess(true);
      setShowMacroInputs(false);
      setTimeout(() => setNutritionGenerateSuccess(false), 3000);
    } catch (e) {
      setNutritionGenerateError(e?.response?.data?.detail || e?.message || "AI beslenme programı oluşturulamadı");
    } finally {
      setNutritionGenerating(false);
    }
  };

  const removeWorkoutProgram = async () => {
    if (!latestWorkoutProgram?.program_id) return;
    if (!window.confirm("Antrenman programını silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/coach/students/${studentId}/workout-programs/${latestWorkoutProgram.program_id}`);
      setLatestWorkoutProgram(null);
      setWorkoutSource(null);
      await Promise.all([fetchActive(), fetchLatestWorkout()]);
    } catch (e) {
      alert(e?.response?.data?.detail || "Program silinemedi");
    }
  };

  const removeNutritionProgram = async () => {
    if (!latestNutritionProgram?.program_id) return;
    if (!window.confirm("Beslenme programını silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/coach/students/${studentId}/nutrition-programs/${latestNutritionProgram.program_id}`);
      setLatestNutritionProgram(null);
      setNutritionSource(null);
      setNutritionWeek({ mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] });
      await Promise.all([fetchActive(), fetchLatestNutrition()]);
    } catch (e) {
      alert(e?.response?.data?.detail || "Program silinemedi");
    }
  };

  const saveCardioProgram = async (sessions) => {
    try {
      await api.post(`/coach/students/${studentId}/cardio-programs`, { sessions });
      setShowCardioEditor(false);
      fetchLatestCardio();
    } catch (e) {
      alert("Kardiyo programı kaydedilemedi");
    }
  };

  const assignCardioProgram = async () => {
    try {
      await api.post(`/coach/students/${studentId}/cardio-programs/assign`);
      fetchLatestCardio();
      fetchActive();
    } catch (e) {
      alert("Kardiyo programı atanamadı");
    }
  };

  const removeCardioProgram = async () => {
    if (!latestCardioProgram?.program_id) return;
    if (!confirm("Kardiyo programını silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/coach/students/${studentId}/cardio-programs/${latestCardioProgram.program_id}`);
      setCardioSessions([]);
      setLatestCardioProgram(null);
      setCardioSource(null);
      fetchActive();
    } catch (e) {
      alert("Kardiyo programı silinemedi");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Programlar yükleniyor...</div>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-red-600">{loadErr}</div>
        <button
          onClick={fetchActive}
          className="mt-3 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <>
      {/* AI Generation Loading Banner */}
      {generating && (
        <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>AI program oluşturuyor...</span>
          </div>
        </div>
      )}

      {/* AI Generation Success Banner */}
      {generateSuccess && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>AI ile Üretildi</span>
          </div>
        </div>
      )}

      {/* AI Generation Error Banner */}
      {generateError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {generateError}
          <button
            onClick={() => setGenerateError(null)}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Kapat
          </button>
        </div>
      )}

      {nutritionGenerating && (
        <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>AI beslenme programı oluşturuyor...</span>
          </div>
        </div>
      )}
      {nutritionGenerateError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {nutritionGenerateError}
        </div>
      )}
      {nutritionGenerateSuccess && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✅ AI beslenme programı oluşturuldu!
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ProgramCard
          title="Antrenman Programı"
          subtitle={
            isLatestProgramActive
              ? "Aktif haftalık plan"
              : hasWorkoutAnyData
              ? "Taslak (atanmadı)"
              : "Antrenman programı yok"
          }
          onEdit={() => setOpen("workout")}
          onGenerate={generateWorkoutWithAI}
          generating={generating}
          isAIGenerated={!isLatestProgramActive && workoutSource === "ai"}
          onRemove={latestWorkoutProgram?.program_id ? removeWorkoutProgram : undefined}
        >
          {isLatestProgramActive && (
            <div className="mb-2">
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                Aktif
              </span>
            </div>
          )}
          {!isLatestProgramActive && hasWorkoutAnyData && (
            <div className="mb-2">
              {workoutSource === "ai" ? (
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  ✨ Taslak (AI ile Üretildi)
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                  Taslak (atanmadı)
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workoutCards.map((d) => (
              <MiniList key={d.key} title={d.title} lines={d.lines} />
            ))}

            {workoutCards.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600 sm:col-span-3">
                {hasWorkoutAnyData
                  ? "Antrenman programı mevcut ancak egzersiz bulunamadı."
                  : "Henüz antrenman yok. Eklemek için Düzenle'ye tıklayın."}
              </div>
            ) : null}
          </div>
        </ProgramCard>

        <ProgramCard
          title="Beslenme Programı"
          subtitle={
            isLatestNutritionActive
              ? "Aktif günlük öğünler"
              : hasNutritionAnyData
              ? "Taslak (atanmadı)"
              : "Aktif beslenme programı yok"
          }
          onEdit={() => setOpen("nutrition")}
          onGenerate={() => setShowMacroInputs(!showMacroInputs)}
          generating={nutritionGenerating}
          isAIGenerated={!isLatestNutritionActive && nutritionSource === "ai"}
          onRemove={latestNutritionProgram?.program_id ? removeNutritionProgram : undefined}
        >
          {isLatestNutritionActive && (
            <div className="mb-2">
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                Aktif
              </span>
            </div>
          )}
          {!isLatestNutritionActive && hasNutritionAnyData && (
            <div className="mb-2">
              {nutritionSource === "ai" ? (
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  ✨ Taslak (AI ile Üretildi)
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                  Taslak (atanmadı)
                </span>
              )}
            </div>
          )}
          {showMacroInputs && (
            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Hedef Makrolar</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-500">Kalori (kcal)</label>
                  <input type="number" value={targetMacros.calories} onChange={e => setTargetMacros(p => ({...p, calories: e.target.value}))}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" placeholder="2500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Protein (g)</label>
                  <input type="number" value={targetMacros.protein} onChange={e => setTargetMacros(p => ({...p, protein: e.target.value}))}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" placeholder="180" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Karbonhidrat (g)</label>
                  <input type="number" value={targetMacros.carbs} onChange={e => setTargetMacros(p => ({...p, carbs: e.target.value}))}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" placeholder="280" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Yag (g)</label>
                  <input type="number" value={targetMacros.fat} onChange={e => setTargetMacros(p => ({...p, fat: e.target.value}))}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" placeholder="80" />
                </div>
              </div>
              <button onClick={generateNutritionWithAI} disabled={nutritionGenerating}
                className="mt-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-purple-700 disabled:opacity-50">
                {nutritionGenerating ? "Oluşturuluyor..." : "✨ Programı Oluştur"}
              </button>
            </div>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            {DAY_LABELS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSelectedDay(k)}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-medium border transition",
                  selectedDay === k
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nutritionCards.map((m) => (
              <MiniList key={m.key} title={m.title} lines={m.lines} />
            ))}

            {nutritionCards.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600 sm:col-span-3">
                {hasNutritionProgram
                  ? "Beslenme programı mevcut ancak öğün bulunamadı."
                  : "Henüz öğün yok. Eklemek için Düzenle'ye tıklayın."}
              </div>
            ) : null}
          </div>
        </ProgramCard>

        <ProgramCard
          title="Kardiyo Programı"
          subtitle={
            cardioSource === 'active' ? '✅ Aktif' :
            cardioSource === 'latest' ? '📝 Taslak' : null
          }
          onEdit={() => setShowCardioEditor(true)}
          onRemove={latestCardioProgram?.program_id ? removeCardioProgram : undefined}
        >
          {cardioSessions.length > 0 ? (
            <div className="space-y-2">
              {cardioSessions.map((s, i) => {
                const dayNames = { mon:'Pzt', tue:'Sal', wed:'Çar', thu:'Per', fri:'Cum', sat:'Cmt', sun:'Paz' };
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">{dayNames[s.day_of_week] || s.day_of_week}</span>
                    <span className="text-sm text-gray-600">{s.cardio_type}</span>
                    <span className="text-sm font-semibold text-blue-600">{s.duration_min} dk</span>
                  </div>
                );
              })}
              {cardioSource === 'latest' && !activeCardioProgramId && (
                <button onClick={assignCardioProgram} className="mt-3 w-full rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                  Programı Ata
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Henüz kardiyo programı oluşturulmamış</p>
          )}
        </ProgramCard>
      </div>

      {/* MODALS */}
      <Modal
        open={open === "workout"}
        title="Antrenman Programını Düzenle"
        onClose={() => setOpen(null)}
      >
        <WorkoutEditor
          initialWeek={displayWorkoutWeek}
          onCancel={() => setOpen(null)}
          onSave={async (week) => {
            try {
              // ✅ Save to backend
              await saveWorkoutToBackend(week);

              // ✅ Immediately update latest workout program (card displays this)
              // Keep existing program_id and source if available
              setLatestWorkoutProgram((prev) => ({
                program_id: prev?.program_id || null,
                week: week,
                generated_by: prev?.generated_by || null,
              }));

              setOpen(null);

              // ✅ Refresh from DB (fetch latest and active)
              await Promise.all([fetchLatestWorkout(), fetchActive()]);
            } catch (e) {
              const msg =
                e?.response?.data?.detail ||
                e?.message ||
                "Antrenman programı kaydedilemedi";
              alert(msg);
              console.error("Workout save failed:", e);
            }
          }}
        />
      </Modal>

      <Modal
        open={open === "nutrition"}
        title="Beslenme Programını Düzenle"
        onClose={() => setOpen(null)}
      >
        <NutritionEditor
          initialWeek={nutritionWeek}
          initialSupplements={latestNutritionProgram?.supplements || activePrograms?.nutrition_program?.supplements || []}
          onCancel={() => setOpen(null)}
          onSave={async (week, supplements) => {
            try {
              await api.post(`/coach/students/${studentId}/nutrition-programs`, { week, supplements });

              setOpen(null);
              await Promise.all([fetchActive(), fetchLatestNutrition()]);
            } catch (e) {
              const msg =
                e?.response?.data?.detail ||
                e?.message ||
                "Beslenme programı kaydedilemedi";
              alert(msg);
              console.error("Nutrition save failed:", e);
            }
          }}
        />
      </Modal>

      <CardioEditor
        open={showCardioEditor}
        onClose={() => setShowCardioEditor(false)}
        sessions={cardioSessions}
        onSave={saveCardioProgram}
      />
    </>
  );
}
