import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProgramCard from "./ProgramCard";
import Modal from "./Modal";
import WorkoutEditor from "./WorkoutEditor";
import NutritionEditor from "./NutritionEditor";
import { api } from "../lib/api";

const DAY_LABELS = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
];

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
          <li className="text-gray-500">No items</li>
        )}
      </ul>
    </div>
  );
}

function formatWorkoutLine(x) {
  const base = `${x?.name || "Untitled"} ${x?.sets || 0}x${x?.reps || ""}`.trim();
  return x?.notes ? `${base} • ${x.notes}` : base;
}

function workoutSummaryCards(week) {
  const filled = DAY_LABELS.map(([k, label]) => ({
    key: k,
    title: label,
    lines: (week?.[k] ?? []).map(formatWorkoutLine),
  })).filter((d) => d.lines.length > 0);

  return filled;
}

function nutritionSummaryCards(week, dayKey = "mon") {
  const meals = week?.[dayKey] ?? [];
  return meals.slice(0, 3).map((m, idx) => ({
    key: `${m.type}-${idx}`,
    title: m.type,
    lines: (m.items ?? []).filter(Boolean),
  }));
}

/** ---------- BACKEND -> UI MAPPERS ---------- **/

function emptyWorkoutWeek() {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

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

function mapWorkoutFromActivePrograms(activePrograms) {
  const week = emptyWorkoutWeek();

  const days = activePrograms?.workout_days ?? [];
  const exs = activePrograms?.workout_exercises ?? [];

  // dayId -> dayKey
  const dayIdToKey = new Map();
  for (const d of days) {
    const id = d?.id;
    const key = normalizeDayKey(d?.day_of_week);
    if (id != null && key) dayIdToKey.set(id, key);
  }

  // group exercises under day
  for (const e of exs) {
    const dayId = e?.workout_day_id ?? null;
    const key = dayIdToKey.get(dayId) || null;
    if (!key) continue;

    week[key].push({
      name: e?.exercise_name ?? "Untitled",
      sets: e?.sets ?? 0,
      reps: e?.reps ?? "",
      notes: e?.notes ?? "",
    });
  }

  return week;
}

function parseNutritionContentToItems(content) {
  if (!content) return [];
  if (Array.isArray(content)) return content.map(String);

  const s = String(content).trim();
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
  }
  if (s.includes("\n")) return s.split("\n").map((x) => x.trim()).filter(Boolean);
  if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean);
  return [s];
}

function mapNutritionFromActivePrograms(activePrograms) {
  const meals = activePrograms?.meals ?? [];
  const dayWeek = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

  const normalized = meals
    .slice()
    .sort((a, b) => (a?.order_index ?? 9999) - (b?.order_index ?? 9999))
    .map((m) => ({
      type: m?.meal_type ?? "Meal",
      items: parseNutritionContentToItems(m?.content),
    }));

  for (const [k] of DAY_LABELS) dayWeek[k] = normalized;
  return dayWeek;
}

/** ---------- COMPONENT ---------- **/

export default function ProgramsTab() {
  const { id } = useParams(); // StudentDetail URL param
  const studentId = id;

  const [open, setOpen] = useState(null); // null | "workout" | "nutrition"
  const [selectedDay, setSelectedDay] = useState("mon");

  const [activePrograms, setActivePrograms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [workoutWeek, setWorkoutWeek] = useState(() => emptyWorkoutWeek());
  const [nutritionWeek, setNutritionWeek] = useState(() => ({
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
  }));

  const fetchActive = async () => {
    if (!studentId) return;
    setLoading(true);
    setLoadErr("");
    try {
      const res = await api.get(`/coach/students/${studentId}/active-programs`);
      setActivePrograms(res.data);
      setWorkoutWeek(mapWorkoutFromActivePrograms(res.data));
      setNutritionWeek(mapNutritionFromActivePrograms(res.data));
    } catch (e) {
      setLoadErr(
        e?.response?.data?.detail ||
          e?.message ||
          "Active programs yüklenemedi"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const workoutCards = useMemo(() => workoutSummaryCards(workoutWeek), [workoutWeek]);
  const nutritionCards = useMemo(
    () => nutritionSummaryCards(nutritionWeek, selectedDay),
    [nutritionWeek, selectedDay]
  );

  const hasWorkoutProgram = !!activePrograms?.workout_program;
  const hasNutritionProgram = !!activePrograms?.nutrition_program;

  async function saveWorkoutToBackend(week) {
    // backend'in beklediği payload: { week: {...} }
    await api.post(`/coach/students/${studentId}/workout-programs`, { week });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Loading programs...</div>
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
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ProgramCard
          title="Workout Program"
          subtitle={hasWorkoutProgram ? "Active weekly plan" : "No active workout program"}
          onEdit={() => setOpen("workout")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workoutCards.map((d) => (
              <MiniList key={d.key} title={d.title} lines={d.lines} />
            ))}

            {workoutCards.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600 sm:col-span-3">
                {hasWorkoutProgram
                  ? "Workout program exists but no exercises found."
                  : "No workouts yet. Click Edit to add."}
              </div>
            ) : null}
          </div>
        </ProgramCard>

        <ProgramCard
          title="Nutrition Program"
          subtitle={hasNutritionProgram ? "Active daily meals" : "No active nutrition program"}
          onEdit={() => setOpen("nutrition")}
        >
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
                  ? "Nutrition program exists but no meals found."
                  : "No meals yet. Click Edit to add."}
              </div>
            ) : null}
          </div>
        </ProgramCard>
      </div>

      {/* MODALS */}
      <Modal
        open={open === "workout"}
        title="Edit Workout Program"
        onClose={() => setOpen(null)}
      >
        <WorkoutEditor
          initialWeek={workoutWeek}
          onCancel={() => setOpen(null)}
          onSave={async (week) => {
            try {
              await saveWorkoutToBackend(week);
              setOpen(null);
              await fetchActive(); // ✅ refresh UI from DB
            } catch (e) {
              const msg =
                e?.response?.data?.detail ||
                e?.message ||
                "Workout program save failed";
              alert(msg);
              console.error("Workout save failed:", e);
            }
          }}
        />
      </Modal>

      <Modal
        open={open === "nutrition"}
        title="Edit Nutrition Program"
        onClose={() => setOpen(null)}
      >
        <NutritionEditor
  initialWeek={nutritionWeek}
  onCancel={() => setOpen(null)}
  onSave={async (week) => {
    try {
      await api.post(`/coach/students/${studentId}/nutrition-programs`, { week });
      setOpen(null);
      await fetchActive(); // ✅ DB’den tekrar çek
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Nutrition program save failed";
      alert(msg);
      console.error("Nutrition save failed:", e);
    }
  }}
/>

      </Modal>
    </>
  );
}
