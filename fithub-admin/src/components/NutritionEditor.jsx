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

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const emptyMeal = () => ({
  type: "Breakfast",
  items: [""],
});

const initialWeek = {
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

export default function NutritionEditor({ initialWeek, onCancel, onSave }) {
  const [day, setDay] = useState("mon");
  const [week, setWeek] = useState(() => structuredClone(initialWeek));
  

  const meals = useMemo(() => week[day] ?? [], [week, day]);

  function addMeal() {
    setWeek((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? []), emptyMeal()],
    }));
  }

  function removeMeal(mealIdx) {
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((_, i) => i !== mealIdx),
    }));
  }

  function updateMeal(mealIdx, patch) {
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((m, i) => (i === mealIdx ? { ...m, ...patch } : m)),
    }));
  }

  function addItem(mealIdx) {
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((m, i) =>
        i === mealIdx ? { ...m, items: [...(m.items ?? []), ""] } : m
      ),
    }));
  }

  function removeItem(mealIdx, itemIdx) {
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((m, i) =>
        i === mealIdx
          ? { ...m, items: (m.items ?? []).filter((_, j) => j !== itemIdx) }
          : m
      ),
    }));
  }

  function updateItem(mealIdx, itemIdx, value) {
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: (m.items ?? []).map((it, j) => (j === itemIdx ? value : it)),
            }
          : m
      ),
    }));
  }

  return (
    <div className="space-y-4">
      {/* day tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2">
        {DAYS.map((d) => (
          <TabBtn key={d.key} active={day === d.key} onClick={() => setDay(d.key)}>
            {d.label}
          </TabBtn>
        ))}
      </div>

      {/* meals */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">
            {DAYS.find((x) => x.key === day)?.label} meals
          </div>
          <button
            onClick={addMeal}
            className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
          >
            + Add meal
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {meals.length === 0 ? (
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              No meals yet. Click <b>+ Add meal</b>.
            </div>
          ) : null}

          {meals.map((m, mealIdx) => (
            <div key={mealIdx} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-full space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full sm:max-w-xs">
                      <div className="mb-1 text-xs text-gray-500">Meal type</div>
                      <select
                        value={m.type}
                        onChange={(e) => updateMeal(mealIdx, { type: e.target.value })}
                        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                      >
                        {MEAL_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem(mealIdx)}
                        className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
                      >
                        + Add item
                      </button>
                      <button
                        onClick={() => removeMeal(mealIdx)}
                        className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        Remove meal
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(m.items ?? []).map((it, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            value={it}
                            onChange={(e) => updateItem(mealIdx, itemIdx, e.target.value)}
                            placeholder="e.g., 150g chicken + salad"
                          />
                        </div>
                        <button
                          onClick={() => removeItem(mealIdx, itemIdx)}
                          className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
