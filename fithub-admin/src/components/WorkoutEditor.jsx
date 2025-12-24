import { useMemo, useState } from "react";

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const emptyExercise = () => ({
  name: "",
  sets: 3,
  reps: "10",
  notes: "",
});

function safeClone(obj) {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
    />
  );
}

export default function WorkoutEditor({ initialWeek, onCancel, onSave }) {
  const [day, setDay] = useState("mon");
  const [week, setWeek] = useState(() => safeClone(initialWeek));

  const items = useMemo(() => week[day] ?? [], [week, day]);

  function addExercise() {
    setWeek((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? []), emptyExercise()],
    }));
  }

  function removeExercise(idx) {
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((_, i) => i !== idx),
    }));
  }

  function updateExercise(idx, patch) {
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((ex, i) =>
        i === idx ? { ...ex, ...patch } : ex
      ),
    }));
  }

  return (
    <div className="space-y-4">
      {/* day tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2">
        {DAYS.map((d) => (
          <TabBtn
            key={d.key}
            active={day === d.key}
            onClick={() => setDay(d.key)}
          >
            {d.label}
          </TabBtn>
        ))}
      </div>

      {/* list */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">
            {DAYS.find((x) => x.key === day)?.label} workout
          </div>
          <button
            onClick={addExercise}
            className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
          >
            + Add exercise
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              No exercises yet. Click <b>+ Add exercise</b>.
            </div>
          )}

          {items.map((ex, idx) => (
            <div key={idx} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <div className="mb-1 text-xs text-gray-500">Exercise</div>
                      <Input
                        value={ex.name}
                        onChange={(e) =>
                          updateExercise(idx, { name: e.target.value })
                        }
                        placeholder="e.g., Leg Press"
                      />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-gray-500">Sets</div>
                      <Input
                        value={String(ex.sets)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          updateExercise(idx, {
                            sets: Number.isFinite(v) && v > 0 ? v : 0,
                          });
                        }}
                        placeholder="4"
                      />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-gray-500">Reps</div>
                      <Input
                        value={ex.reps}
                        onChange={(e) =>
                          updateExercise(idx, { reps: e.target.value })
                        }
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-gray-500">
                      Notes (optional)
                    </div>
                    <Input
                      value={ex.notes}
                      onChange={(e) =>
                        updateExercise(idx, { notes: e.target.value })
                      }
                      placeholder="tempo, rest time, RPE..."
                    />
                  </div>
                </div>

                <button
                  onClick={() => removeExercise(idx)}
                  className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(week)}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}
