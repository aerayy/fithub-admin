import { useState, useMemo } from "react";
import ProgramCard from "./ProgramCard";
import Modal from "./Modal";
import WorkoutEditor from "./WorkoutEditor";
import NutritionEditor from "./NutritionEditor";

const INITIAL_WORKOUT_WEEK = {
  mon: [{ name: "Leg Press", sets: 4, reps: "10", notes: "" }],
  tue: [],
  wed: [{ name: "Bench Press", sets: 4, reps: "6", notes: "" }],
  thu: [],
  fri: [{ name: "Squat", sets: 4, reps: "5", notes: "" }],
  sat: [],
  sun: [],
};

const INITIAL_NUTRITION_WEEK = {
  mon: [
    { type: "Breakfast", items: ["Oats + yogurt", "1 banana"] },
    { type: "Lunch", items: ["Chicken bowl", "Salad"] },
    { type: "Dinner", items: ["Salmon", "Rice", "Veggies"] },
  ],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

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
function firstFilledDayKeyForNutrition(week) {
    for (const [k] of DAY_LABELS) {
      confirms: null
      if ((week?.[k] ?? []).length > 0) return k;
    }
    return "mon";
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

export default function ProgramsTab() {
  const [open, setOpen] = useState(null); // null | "workout" | "nutrition"

  const [workoutWeek, setWorkoutWeek] = useState(() =>
    structuredClone(INITIAL_WORKOUT_WEEK)
  );
  const [nutritionWeek, setNutritionWeek] = useState(() =>
    structuredClone(INITIAL_NUTRITION_WEEK)
  );
  const [selectedDay, setSelectedDay] = useState("mon");


  const workoutCards = useMemo(() => workoutSummaryCards(workoutWeek), [workoutWeek]);
  const nutritionCards = useMemo(
    () => nutritionSummaryCards(nutritionWeek, selectedDay),
    [nutritionWeek, selectedDay]
  );
  
  

  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ProgramCard
          title="Workout Program"
          subtitle="Weekly plan"
          onEdit={() => setOpen("workout")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {workoutCards.map((d) => (
              <MiniList key={d.key} title={d.title} lines={d.lines} />
            ))}
            {workoutCards.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600 sm:col-span-3">
                No workouts yet. Click <b>Edit</b> to add.
              </div>
            ) : null}
          </div>
        </ProgramCard>

        <ProgramCard
          title="Nutrition Program"
          subtitle="Daily meals"
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
                No meals yet. Click <b>Edit</b> to add.
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
          onSave={(week) => {
            setWorkoutWeek(week);
            setOpen(null);
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
          onSave={(week) => {
            setNutritionWeek(week);
            setOpen(null);
          }}
        />
      </Modal>
    </>
  );
}
