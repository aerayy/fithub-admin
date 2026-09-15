import { useEffect, useMemo, useState } from "react";
import ExerciseSearchInput from "./ExerciseSearchInput";

const DAYS = [
  { key: "mon", label: "Pzt" },
  { key: "tue", label: "Sal" },
  { key: "wed", label: "Çar" },
  { key: "thu", label: "Per" },
  { key: "fri", label: "Cum" },
  { key: "sat", label: "Cmt" },
  { key: "sun", label: "Paz" },
];

const emptyExercise = () => ({
  name: "",
  sets: 3,
  reps: "10",
  notes: "",
});

const emptyDayPayload = () => ({
  title: "",
  kcal: "",
  coach_note: "",
  scheduled_time: "", // Gün için antrenman saati (örn. "09:00")
  warmup: { duration_min: "", items: [] },
  blocks: [
    {
      title: "Antrenman Bloğu",
      items: [],
    },
  ],
});

function safeClone(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Backward compatible:
 * - if initialWeek[day] is Array => treat as old format exercises list
 * - normalize into dayPayload
 */
function normalizeInitialWeek(initialWeek) {
  const src = safeClone(initialWeek || {});
  const out = {};

  for (const d of DAYS) {
    const v = src[d.key];

    // old format: exercises[]
    if (Array.isArray(v)) {
      const dayPayload = emptyDayPayload();
      dayPayload.blocks[0].items = v.map((ex) => ({
        type: "exercise",
        ...emptyExercise(),
        ...ex,
      }));
      out[d.key] = dayPayload;
      continue;
    }

    // new format: dayPayload
    if (v && typeof v === "object") {
      out[d.key] = {
        ...emptyDayPayload(),
        ...v,
        warmup: {
          ...emptyDayPayload().warmup,
          ...(v.warmup || {}),
          items: (v.warmup?.items || []).map((x) => ({ ...emptyExercise(), ...x })),
        },
        blocks: (v.blocks?.length ? v.blocks : emptyDayPayload().blocks).map((b) => ({
          title: b.title ?? "Antrenman Bloğu",
          items: (b.items || []).map((it) => {
            if (it?.type === "superset") {
              return {
                type: "superset",
                items: (it.items || []).map((x) => ({ ...emptyExercise(), ...x })),
              };
            }
            return { type: "exercise", ...emptyExercise(), ...(it || {}) };
          }),
        })),
      };
      continue;
    }

    // empty
    out[d.key] = emptyDayPayload();
  }

  return out;
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
    />
  );
}

function SectionTitle({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gray-100 text-sm">
          {icon}
        </div>
        <div className="text-sm font-semibold text-gray-900">{title}</div>
      </div>
      {right}
    </div>
  );
}

const MAX_WEEKS = 4;

/** initialWeeks: {1: week, 2: week, ...} (çok haftalı) → normalize; yoksa tek hafta {1: initialWeek}. */
function normalizeInitialWeeks(initialWeeks, initialWeek) {
  const out = {};
  if (initialWeeks && typeof initialWeeks === "object") {
    for (const k of Object.keys(initialWeeks)) {
      const idx = Number(k);
      if (Number.isInteger(idx) && idx >= 1 && idx <= MAX_WEEKS && initialWeeks[k]) {
        out[idx] = normalizeInitialWeek(initialWeeks[k]);
      }
    }
  }
  if (Object.keys(out).length === 0) out[1] = normalizeInitialWeek(initialWeek);
  return out;
}

export default function WorkoutEditor({
  initialWeek, initialWeeks, initialWeekIndex, valueWeek, onCancel, onSave, onDraftSave,
}) {
  const [day, setDay] = useState("mon");
  // Çok haftalı düzenleme: weeks = {1: week, ...}; `week` ve `setWeek` seçili haftaya bakar,
  // böylece aşağıdaki tüm gün/blok işlemleri değişmeden çalışır.
  const [weeks, setWeeks] = useState(() => normalizeInitialWeeks(initialWeeks, initialWeek));
  const [weekIdx, setWeekIdx] = useState(() => {
    const n = Number(initialWeekIndex);
    return Number.isInteger(n) && n >= 1 && n <= MAX_WEEKS ? n : 1;
  });
  const weekNumbers = useMemo(
    () => Object.keys(weeks).map(Number).filter((n) => Number.isInteger(n)).sort((a, b) => a - b),
    [weeks]
  );
  const activeWeekIdx = weeks[weekIdx] ? weekIdx : (weekNumbers[0] || 1);
  const week = weeks[activeWeekIdx] ?? normalizeInitialWeek({});
  const setWeek = (updater) =>
    setWeeks((prev) => {
      const cur = prev[activeWeekIdx] ?? normalizeInitialWeek({});
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...prev, [activeWeekIdx]: next };
    });

  // Sync internal state when valueWeek prop changes (for AI injection)
  useEffect(() => {
    if (valueWeek) {
      setWeeks({ 1: normalizeInitialWeek(valueWeek) });
      setWeekIdx(1);
    }
  }, [valueWeek]);

  const multiWeek = weekNumbers.length > 1;
  const weeksForSave = () => (multiWeek ? weeks : null);

  function addWeek() {
    setWeeks((prev) => {
      const nums = Object.keys(prev).map(Number).sort((a, b) => a - b);
      if (nums.length >= MAX_WEEKS) return prev;
      const nextIdx = nums.length + 1;
      // Yeni hafta = seçili haftanın kopyası (koç sadece ilerleme farkını düzenler)
      const next = { ...prev, [nextIdx]: safeClone(prev[activeWeekIdx] ?? normalizeInitialWeek({})) };
      setTimeout(() => setWeekIdx(nextIdx), 0);
      return next;
    });
  }

  function removeWeek(idx) {
    setWeeks((prev) => {
      const nums = Object.keys(prev).map(Number).sort((a, b) => a - b);
      if (nums.length <= 1) return prev;
      const remaining = nums.filter((n) => n !== idx).map((n) => prev[n]);
      const out = {};
      remaining.forEach((w, i) => { out[i + 1] = w; });
      setTimeout(() => setWeekIdx(Math.min(idx, remaining.length)), 0);
      return out;
    });
  }

  function copyWeekToFollowing() {
    setWeeks((prev) => {
      const src = prev[activeWeekIdx];
      if (!src) return prev;
      const out = { ...prev };
      for (const k of Object.keys(prev).map(Number)) {
        if (k > activeWeekIdx) out[k] = safeClone(src);
      }
      return out;
    });
  }

  const dayObj = useMemo(() => week[day] ?? emptyDayPayload(), [week, day]);

  function updateDay(patch) {
    setWeek((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? emptyDayPayload()), ...patch },
    }));
  }

  // -------- Warmup ops --------
  function addWarmupExercise() {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const warmup = d.warmup ?? { duration_min: "", items: [] };
      return {
        ...prev,
        [day]: { ...d, warmup: { ...warmup, items: [...(warmup.items || []), emptyExercise()] } },
      };
    });
  }

  function removeWarmupExercise(idx) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const warmup = d.warmup ?? { duration_min: "", items: [] };
      return {
        ...prev,
        [day]: {
          ...d,
          warmup: { ...warmup, items: (warmup.items || []).filter((_, i) => i !== idx) },
        },
      };
    });
  }

  function updateWarmupExercise(idx, patch) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const warmup = d.warmup ?? { duration_min: "", items: [] };
      return {
        ...prev,
        [day]: {
          ...d,
          warmup: {
            ...warmup,
            items: (warmup.items || []).map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)),
          },
        },
      };
    });
  }

  // -------- Blocks ops --------
  function addBlock() {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = d.blocks || [];
      return {
        ...prev,
        [day]: {
          ...d,
          blocks: [...blocks, { title: "Antrenman Bloğu", items: [] }],
        },
      };
    });
  }

  function removeBlock(blockIdx) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      return {
        ...prev,
        [day]: { ...d, blocks: (d.blocks || []).filter((_, i) => i !== blockIdx) },
      };
    });
  }

  function updateBlockTitle(blockIdx, title) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) => (i === blockIdx ? { ...b, title } : b));
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function addExerciseToBlock(blockIdx) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) =>
        i === blockIdx
          ? { ...b, items: [...(b.items || []), { type: "exercise", ...emptyExercise() }] }
          : b
      );
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function addSupersetToBlock(blockIdx) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) =>
        i === blockIdx
          ? {
              ...b,
              items: [
                ...(b.items || []),
                { type: "superset", items: [emptyExercise(), emptyExercise()] },
              ],
            }
          : b
      );
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function removeBlockItem(blockIdx, itemIdx) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) =>
        i === blockIdx ? { ...b, items: (b.items || []).filter((_, j) => j !== itemIdx) } : b
      );
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function updateBlockExercise(blockIdx, itemIdx, patch) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) => {
        if (i !== blockIdx) return b;
        const items = (b.items || []).map((it, j) => {
          if (j !== itemIdx) return it;
          if (it.type !== "exercise") return it;
          return { ...it, ...patch };
        });
        return { ...b, items };
      });
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function updateSupersetExercise(blockIdx, itemIdx, supIdx, patch) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) => {
        if (i !== blockIdx) return b;
        const items = (b.items || []).map((it, j) => {
          if (j !== itemIdx) return it;
          if (it.type !== "superset") return it;
          const supItems = (it.items || []).map((ex, k) => (k === supIdx ? { ...ex, ...patch } : ex));
          return { ...it, items: supItems };
        });
        return { ...b, items };
      });
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function addExerciseToSuperset(blockIdx, itemIdx) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) => {
        if (i !== blockIdx) return b;
        const items = (b.items || []).map((it, j) => {
          if (j !== itemIdx) return it;
          if (it.type !== "superset") return it;
          return { ...it, items: [...(it.items || []), emptyExercise()] };
        });
        return { ...b, items };
      });
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function removeExerciseFromSuperset(blockIdx, itemIdx, supIdx) {
    setWeek((prev) => {
      const d = prev[day] ?? emptyDayPayload();
      const blocks = (d.blocks || []).map((b, i) => {
        if (i !== blockIdx) return b;
        const items = (b.items || []).map((it, j) => {
          if (j !== itemIdx) return it;
          if (it.type !== "superset") return it;
          return { ...it, items: (it.items || []).filter((_, k) => k !== supIdx) };
        });
        return { ...b, items };
      });
      return { ...prev, [day]: { ...d, blocks } };
    });
  }

  function parsePositiveInt(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  return (
    <div className="space-y-4">
      {/* week tabs — 4 haftalık (v3) programlar ve çok haftalı manuel programlar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-2">
        <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Hafta</span>
        {weekNumbers.map((n) => (
          <TabBtn key={n} active={activeWeekIdx === n} onClick={() => setWeekIdx(n)}>
            {n}. Hafta
          </TabBtn>
        ))}
        {weekNumbers.length < MAX_WEEKS && (
          <button
            onClick={addWeek}
            type="button"
            title="Seçili haftanın kopyasıyla yeni hafta ekle (en fazla 4)"
            className="rounded-xl border border-dashed px-3 py-2 text-sm font-medium text-gray-500 hover:border-[#3E9E8E] hover:text-[#2B7B6E]"
          >
            + Hafta
          </button>
        )}
        {multiWeek && (
          <>
            <button
              onClick={copyWeekToFollowing}
              type="button"
              title="Bu haftayı sonraki haftalara kopyala"
              className="ml-auto rounded-xl border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Sonraki haftalara kopyala
            </button>
            <button
              onClick={() => removeWeek(activeWeekIdx)}
              type="button"
              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Haftayı kaldır
            </button>
          </>
        )}
      </div>

      {/* day tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2">
        {DAYS.map((d) => (
          <TabBtn key={d.key} active={day === d.key} onClick={() => setDay(d.key)}>
            {d.label}
          </TabBtn>
        ))}
      </div>

      {/* Day header — simplified */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-1 text-xs text-gray-500">Koç notu (isteğe bağlı)</div>
        <Textarea
          value={dayObj.coach_note}
          onChange={(e) => updateDay({ coach_note: e.target.value })}
          placeholder="Bu gün için öğrenciye notun..."
          rows={2}
        />
      </div>

      {/* Warm Up Flow */}
      <div className="rounded-2xl border bg-white p-4">
        <SectionTitle
          icon=""
          title="Isınma"
          right={
            <button
              onClick={addWarmupExercise}
              className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
              type="button"
            >
              + Isınma ekle
            </button>
          }
        />

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="mb-1 text-xs text-gray-500">Süre (dk)</div>
            <Input
              value={String(dayObj.warmup?.duration_min ?? "")}
              onChange={(e) =>
                updateDay({
                  warmup: {
                    ...(dayObj.warmup || { items: [] }),
                    duration_min: e.target.value,
                  },
                })
              }
              placeholder="5"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(dayObj.warmup?.items || []).length === 0 && (
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              Henüz ısınma hareketi yok.
            </div>
          )}

          {(dayObj.warmup?.items || []).map((ex, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-xl border p-3">
              <div className="flex-1 min-w-0">
                <ExerciseSearchInput
                  value={ex.name}
                  onChange={(name, exercise) => updateWarmupExercise(idx, { name, exercise_library_id: exercise?.id || ex.exercise_library_id })}
                  placeholder="Egzersiz ara..."
                />
              </div>
              <div className="w-16">
                <Input
                  value={String(ex.sets)}
                  onChange={(e) => updateWarmupExercise(idx, { sets: parsePositiveInt(e.target.value) })}
                  placeholder="Set"
                />
              </div>
              <div className="w-16">
                <Input
                  value={ex.reps}
                  onChange={(e) => updateWarmupExercise(idx, { reps: e.target.value })}
                  placeholder="Tekrar"
                />
              </div>
              <button onClick={() => removeWarmupExercise(idx)} className="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50" type="button">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Blocks */}
      <div className="rounded-2xl border bg-white p-4">
        <SectionTitle
          icon=""
          title="Egzersizler"
          right={
            <button
              onClick={addBlock}
              className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              type="button"
            >
              + Blok ekle
            </button>
          }
        />

        <div className="mt-4 space-y-4">
          {(dayObj.blocks || []).length === 0 && (
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              Henüz blok yok. <b>+ Blok ekle</b>'ye tıklayın.
            </div>
          )}

          {(dayObj.blocks || []).map((block, bIdx) => (
            <div key={bIdx} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-700">Blok {bIdx + 1}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addExerciseToBlock(bIdx)}
                        className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
                        type="button"
                      >
                        + Egzersiz
                      </button>
                      <button
                        onClick={() => addSupersetToBlock(bIdx)}
                        className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                        type="button"
                      >
                        + Süperset
                      </button>
                    </div>
                  </div>

                  {/* Block items */}
                  <div className="mt-4 space-y-3">
                    {(block.items || []).length === 0 && (
                      <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                        Boş blok. Egzersiz veya süperset ekleyin.
                      </div>
                    )}

                    {(block.items || []).map((it, itemIdx) => {
                      if (it.type === "superset") {
                        return (
                          <div
                            key={itemIdx}
                            className="rounded-2xl border-2 border-purple-500/60 bg-purple-50 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold tracking-wide text-purple-700">
                                SÜPERSET
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => addExerciseToSuperset(bIdx, itemIdx)}
                                  className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white"
                                  type="button"
                                >
                                  + Ekle
                                </button>
                                <button
                                  onClick={() => removeBlockItem(bIdx, itemIdx)}
                                  className="rounded-xl border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
                                  type="button"
                                >
                                  Süperseti kaldır
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              {(it.items || []).map((ex, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2 rounded-xl border bg-white p-3">
                                  <div className="flex-1 min-w-0">
                                    <ExerciseSearchInput
                                      value={ex.name}
                                      onChange={(name, exercise) => updateSupersetExercise(bIdx, itemIdx, sIdx, { name, exercise_library_id: exercise?.id || ex.exercise_library_id })}
                                      placeholder="Egzersiz ara..."
                                    />
                                  </div>
                                  <div className="w-16">
                                    <Input value={String(ex.sets)} onChange={(e) => updateSupersetExercise(bIdx, itemIdx, sIdx, { sets: parsePositiveInt(e.target.value) })} placeholder="Set" />
                                  </div>
                                  <div className="w-16">
                                    <Input value={ex.reps} onChange={(e) => updateSupersetExercise(bIdx, itemIdx, sIdx, { reps: e.target.value })} placeholder="Tekrar" />
                                  </div>
                                  <button onClick={() => removeExerciseFromSuperset(bIdx, itemIdx, sIdx)} className="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50" type="button">✕</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // normal exercise
                      const ex = it;
                      return (
                        <div key={itemIdx} className="flex items-center gap-2 rounded-xl border p-3">
                          <div className="flex-1 min-w-0">
                            <ExerciseSearchInput
                              value={ex.name}
                              onChange={(name, exercise) => updateBlockExercise(bIdx, itemIdx, { name, exercise_library_id: exercise?.id || ex.exercise_library_id })}
                              placeholder="Egzersiz ara..."
                            />
                          </div>
                          <div className="w-16">
                            <Input value={String(ex.sets)} onChange={(e) => updateBlockExercise(bIdx, itemIdx, { sets: parsePositiveInt(e.target.value) })} placeholder="Set" />
                          </div>
                          <div className="w-16">
                            <Input value={ex.reps} onChange={(e) => updateBlockExercise(bIdx, itemIdx, { reps: e.target.value })} placeholder="Tekrar" />
                          </div>
                          <button onClick={() => removeBlockItem(bIdx, itemIdx)} className="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50" type="button">✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => removeBlock(bIdx)}
                  className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  type="button"
                >
                  Bloğu sil
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
          type="button"
        >
          İptal
        </button>
        {onDraftSave && (
          <button
            onClick={() => onDraftSave(weeks[1] ?? week, weeksForSave())}
            className="rounded-xl border border-[#3E9E8E] px-4 py-2 text-sm font-semibold text-[#3E9E8E] hover:bg-[#3E9E8E]/5"
            type="button"
          >
            Taslak Olarak Kaydet
          </button>
        )}
        <button
          onClick={() => onSave(weeks[1] ?? week, weeksForSave())}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          type="button"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}
