import { useMemo, useState } from "react";
import FoodSearchInput from "./FoodSearchInput";

const DAYS = [
  { key: "mon", label: "Pzt" },
  { key: "tue", label: "Sal" },
  { key: "wed", label: "Çar" },
  { key: "thu", label: "Per" },
  { key: "fri", label: "Cum" },
  { key: "sat", label: "Cmt" },
  { key: "sun", label: "Paz" },
];

const MEAL_TYPES = ["Kahvaltı", "Öğle Yemeği", "Akşam Yemeği", "Atıştırmalık"];

/** Yeni item yapısı: besin + unit/amount/grams + hesaplanmış makrolar */
function emptyItem() {
  return {
    food_id: null,
    name_tr: "",
    name_en: "",
    unit: "g",
    amount: 100,
    piece_weight_g: null,
    grams: 100,
    calories_per_100g: 0,
    protein_per_100g: 0,
    carbs_per_100g: 0,
    fat_per_100g: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
}

/** amount + unit + piece_weight_g → grams */
function amountToGrams(unit, amount, piece_weight_g) {
  const a = Number(amount) || 0;
  if (unit === "adet") {
    const pw = Number(piece_weight_g) || 0;
    return pw > 0 ? a * pw : 0;
  }
  return a;
}

function isItemObject(it) {
  return it && typeof it === "object" && !Array.isArray(it) && ("food_id" in it || "name_tr" in it || "grams" in it);
}

/** Eski string item'ı yeni formata çevir (backward compatibility) */
function legacyItemToObject(str) {
  const s = typeof str === "string" ? str : String(str ?? "").trim();
  return {
    ...emptyItem(),
    name_tr: s,
    name_en: s,
    unit: "g",
    amount: 100,
    grams: 100,
  };
}

function ensureItem(it) {
  if (isItemObject(it)) {
    const base = emptyItem();
    const merged = { ...base, ...it };
    const piece_weight_g = merged.piece_weight_g ?? null;
    let unit = merged.unit ?? "g";
    let amount = merged.amount;
    if (amount == null || amount === "") {
      const grams = merged.grams ?? 100;
      if (unit === "adet" && piece_weight_g > 0) {
        amount = Math.round(grams / piece_weight_g) || 1;
      } else {
        amount = grams;
        unit = "g";
      }
    }
    merged.unit = unit;
    merged.amount = amount;
    merged.piece_weight_g = piece_weight_g;
    merged.grams = merged.grams ?? amountToGrams(unit, amount, piece_weight_g);
    return merged;
  }
  return legacyItemToObject(it);
}

/** Makroları grama göre hesapla (100g bazlı değerlerden); item.grams ve item.unit/amount güncellenmez, sadece makro alanları */
function calculateMacros(item, grams) {
  const g = Number(grams) || 0;
  const mult = g / 100;
  const calories_per_100g = Number(item?.calories_per_100g) || 0;
  const protein_per_100g = Number(item?.protein_per_100g) || 0;
  const carbs_per_100g = Number(item?.carbs_per_100g) || 0;
  const fat_per_100g = Number(item?.fat_per_100g) || 0;
  return {
    ...item,
    grams: g,
    calories: Math.round(calories_per_100g * mult),
    protein: Math.round(protein_per_100g * mult * 10) / 10,
    carbs: Math.round(carbs_per_100g * mult * 10) / 10,
    fat: Math.round(fat_per_100g * mult * 10) / 10,
  };
}

const emptyMeal = () => ({
  type: "Kahvaltı",
  time: "",
  items: [emptyItem()],
});

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

function ensureMealHasTime(m) {
  return { ...emptyMeal(), ...m, time: m?.time ?? "" };
}

function normalizeMealItems(meal) {
  const items = (meal?.items ?? []).map(ensureItem);
  if (items.length === 0) return [emptyItem()];
  return items;
}

function normalizeInitialWeek(init) {
  const week = structuredClone(init || {});
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  days.forEach((d) => {
    const raw = week[d] ?? [];
    week[d] = raw.map((m) => ({
      ...ensureMealHasTime(m),
      items: normalizeMealItems(m),
    }));
  });
  return week;
}

export default function NutritionEditor({ initialWeek, initialSupplements, onCancel, onSave }) {
  const [day, setDay] = useState("mon");
  const [week, setWeek] = useState(() => normalizeInitialWeek(initialWeek));
  const [supplements, setSupplements] = useState(initialSupplements || []);

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
        i === mealIdx ? { ...m, items: [...(m.items ?? []), emptyItem()] } : m
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

  /** API'den gelen food'u item yapısına çevir; piece_weight_g varsa varsayılan adet, yoksa gram */
  function selectFood(mealIdx, itemIdx, food) {
    if (!food) return;
    const nutrients = food.nutrients ?? {};
    const piece_weight_g = food.piece_weight_g != null ? Number(food.piece_weight_g) : null;
    const unit = piece_weight_g != null && piece_weight_g > 0 ? "adet" : "g";
    const amount = unit === "adet" ? 1 : 100;
    const grams = amountToGrams(unit, amount, piece_weight_g);
    const item = {
      food_id: food.id,
      name_tr: food.name_tr ?? "",
      name_en: food.name_en ?? "",
      unit,
      amount,
      piece_weight_g,
      grams,
      calories_per_100g: Number(nutrients.calories_kcal) || 0,
      protein_per_100g: Number(nutrients.protein_g) || 0,
      carbs_per_100g: Number(nutrients.carbs_g) || 0,
      fat_per_100g: Number(nutrients.fat_g) || 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
    const withMacros = calculateMacros(item, grams);
    setWeek((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: (m.items ?? []).map((it, j) =>
                j === itemIdx ? withMacros : it
              ),
            }
          : m
      ),
    }));
  }

  /** amount değişince (gram veya adet); grams hesapla, makroları güncelle */
  function updateAmount(mealIdx, itemIdx, rawValue) {
    setWeek((prev) => {
      const meal = (prev[day] ?? [])[mealIdx];
      const item = (meal?.items ?? [])[itemIdx];
      if (!item) return prev;
      const amount = Number(rawValue) || 0;
      const grams = amountToGrams(item.unit, amount, item.piece_weight_g);
      const updated = calculateMacros({ ...item, amount, grams }, grams);
      return {
        ...prev,
        [day]: (prev[day] ?? []).map((m, i) =>
          i === mealIdx
            ? {
                ...m,
                items: (m.items ?? []).map((it, j) =>
                  j === itemIdx ? updated : it
                ),
              }
            : m
        ),
      };
    });
  }

  /** Gram / Adet birim değişince; mevcut grams'ı koruyup amount'u birime göre güncelle */
  function setUnit(mealIdx, itemIdx, newUnit) {
    setWeek((prev) => {
      const meal = (prev[day] ?? [])[mealIdx];
      const item = (meal?.items ?? [])[itemIdx];
      if (!item) return prev;
      const grams = Number(item.grams) || 0;
      let amount;
      if (newUnit === "adet") {
        const pw = Number(item.piece_weight_g) || 0;
        amount = pw > 0 ? Math.round(grams / pw) || 1 : 1;
      } else {
        amount = grams;
      }
      const updated = calculateMacros(
        { ...item, unit: newUnit, amount, grams },
        grams
      );
      return {
        ...prev,
        [day]: (prev[day] ?? []).map((m, i) =>
          i === mealIdx
            ? {
                ...m,
                items: (m.items ?? []).map((it, j) =>
                  j === itemIdx ? updated : it
                ),
              }
            : m
        ),
      };
    });
  }

  /** Adet için 1 adet = X gram (API'de yoksa kullanıcı girer) */
  function setPieceWeight(mealIdx, itemIdx, value) {
    const pw = Math.max(0, Number(value) || 0);
    setWeek((prev) => {
      const meal = (prev[day] ?? [])[mealIdx];
      const item = (meal?.items ?? [])[itemIdx];
      if (!item) return prev;
      const unit = item.unit;
      const amount = unit === "adet" ? (Number(item.amount) || 1) : (Number(item.grams) || 100);
      const grams = unit === "adet" && pw > 0 ? amount * pw : (unit === "g" ? amount : Number(item.grams) || 0);
      const updated = calculateMacros(
        { ...item, piece_weight_g: pw || null, unit, amount, grams },
        grams
      );
      if (unit === "adet" && pw > 0) updated.amount = amount;
      return {
        ...prev,
        [day]: (prev[day] ?? []).map((m, i) =>
          i === mealIdx
            ? {
                ...m,
                items: (m.items ?? []).map((it, j) =>
                  j === itemIdx ? updated : it
                ),
              }
            : m
        ),
      };
    });
  }

  /** Öğün toplam makroları */
  function mealTotals(meal) {
    const items = meal?.items ?? [];
    return items.reduce(
      (acc, it) => ({
        calories: acc.calories + (Number(it.calories) || 0),
        protein: acc.protein + (Number(it.protein) || 0),
        carbs: acc.carbs + (Number(it.carbs) || 0),
        fat: acc.fat + (Number(it.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  function addSupplement() {
    setSupplements(prev => [...prev, { name: '', dosage: '', unit: '', notes: '' }]);
  }
  function removeSupplement(idx) {
    setSupplements(prev => prev.filter((_, i) => i !== idx));
  }
  function updateSupplement(idx, field, value) {
    setSupplements(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  /** FoodSearchInput için seçili besin objesi (sadece display) */
  function itemToFoodValue(item) {
    if (!item?.food_id && !item?.name_tr) return null;
    return {
      id: item.food_id ?? null,
      name_tr: item.name_tr ?? "",
      name_en: item.name_en ?? "",
    };
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
            {DAYS.find((x) => x.key === day)?.label} öğünleri
          </div>
          <button
            onClick={addMeal}
            className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
          >
            + Öğün ekle
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {meals.length === 0 ? (
            <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
              Henüz öğün yok. <b>+ Öğün ekle</b>'ye tıklayın.
            </div>
          ) : null}

          {meals.map((m, mealIdx) => {
            const totals = mealTotals(m);
            return (
              <div key={mealIdx} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full sm:max-w-xs">
                      <div className="mb-1 text-xs text-gray-500">Öğün tipi</div>
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
                    <div className="w-full sm:max-w-[140px]">
                      <div className="mb-1 text-xs text-gray-500">Saat</div>
                      <input
                        type="time"
                        value={m.time ?? ""}
                        onChange={(e) => updateMeal(mealIdx, { time: e.target.value })}
                        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem(mealIdx)}
                        className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
                      >
                        + Besin ekle
                      </button>
                      <button
                        onClick={() => removeMeal(mealIdx)}
                        className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        Öğünü kaldır
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(m.items ?? []).map((it, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex flex-wrap items-center gap-2 rounded-xl border bg-gray-50/50 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-xs text-gray-500">Besin</div>
                          <FoodSearchInput
                            value={itemToFoodValue(it)}
                            onSelect={(food) => selectFood(mealIdx, itemIdx, food)}
                            placeholder="Besin ara..."
                          />
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                          {(it.food_id || it.name_tr) ? (
                            <>
                              <div className="flex rounded-xl border border-gray-200 bg-white p-0.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => setUnit(mealIdx, itemIdx, "g")}
                                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                                    it.unit === "g"
                                      ? "bg-black text-white shadow-sm"
                                      : "text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  Gram
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setUnit(mealIdx, itemIdx, "adet")}
                                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                                    it.unit === "adet"
                                      ? "bg-black text-white shadow-sm"
                                      : "text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  Adet
                                </button>
                              </div>
                              {it.unit === "adet" && (it.piece_weight_g == null || it.piece_weight_g <= 0) ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-20">
                                    <div className="mb-1 text-xs text-gray-500">1 adet</div>
                                    <input
                                      type="number"
                                      min={1}
                                      placeholder="gr"
                                      value={it.piece_weight_g ?? ""}
                                      onChange={(e) =>
                                        setPieceWeight(mealIdx, itemIdx, e.target.value)
                                      }
                                      className="w-full rounded-xl border bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                                    />
                                  </div>
                                  <span className="pb-2 text-xs text-gray-500">gram</span>
                                </div>
                              ) : (
                                <>
                                  <div className={it.unit === "g" ? "w-24" : "w-20"}>
                                    <div className="mb-1 text-xs text-gray-500">
                                      {it.unit === "g" ? "Gram" : "Adet"}
                                    </div>
                                    <input
                                      type="number"
                                      min={it.unit === "g" ? 0 : 1}
                                      step={it.unit === "g" ? 10 : 1}
                                      value={it.amount ?? ""}
                                      onChange={(e) =>
                                        updateAmount(mealIdx, itemIdx, e.target.value)
                                      }
                                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                                    />
                                  </div>
                                  {it.unit === "adet" && (it.piece_weight_g != null && it.piece_weight_g > 0) && (
                                    <span className="pb-2 text-xs text-gray-500">
                                      = {it.grams ?? 0} g
                                    </span>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <div className="w-24">
                              <div className="mb-1 text-xs text-gray-500">Miktar</div>
                              <input
                                type="number"
                                min={0}
                                step={10}
                                value={it.amount ?? ""}
                                onChange={(e) =>
                                  updateAmount(mealIdx, itemIdx, e.target.value)
                                }
                                disabled
                                placeholder="Besin seçin"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 outline-none"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-end gap-1">
                          <div className="rounded-lg bg-white px-2 py-1.5 text-xs text-gray-700 tabular-nums">
                            {it.calories ?? 0} kcal | {it.protein ?? 0} P |{" "}
                            {it.carbs ?? 0} C | {it.fat ?? 0} F
                          </div>
                          <button
                            onClick={() => removeItem(mealIdx, itemIdx)}
                            className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-100"
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(m.items ?? []).length > 0 && (
                    <div className="border-t pt-2 text-right text-sm font-medium text-gray-700">
                      Öğün toplam: {totals.calories} kcal | {totals.protein.toFixed(1)} P |{" "}
                      {totals.carbs.toFixed(1)} C | {totals.fat.toFixed(1)} F
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Takviyeler / Supplements */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-900">Takviyeler</div>
          <button type="button" onClick={addSupplement} className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white hover:bg-black/90">
            + Takviye Ekle
          </button>
        </div>
        <div className="space-y-3">
          {supplements.length === 0 && (
            <div className="rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Henüz takviye eklenmedi. Yukarıdaki butona tıklayarak takviye ekleyebilirsiniz.
            </div>
          )}
          {supplements.map((s, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 rounded-xl border bg-gray-50/50 p-3">
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1 block text-xs text-gray-500">Takviye Adı</label>
                <input value={s.name} onChange={e => updateSupplement(idx, 'name', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20" placeholder="Whey Protein" />
              </div>
              <div className="w-20">
                <label className="mb-1 block text-xs text-gray-500">Doz</label>
                <input value={s.dosage} onChange={e => updateSupplement(idx, 'dosage', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20" placeholder="1" />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-xs text-gray-500">Birim</label>
                <input value={s.unit} onChange={e => updateSupplement(idx, 'unit', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20" placeholder="ölçü / g / kapsül" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1 block text-xs text-gray-500">Not</label>
                <input value={s.notes} onChange={e => updateSupplement(idx, 'notes', e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20" placeholder="Antrenman sonrası" />
              </div>
              <button type="button" onClick={() => removeSupplement(idx)} className="rounded-xl border px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                Kaldır
              </button>
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
          İptal
        </button>
        <button
          onClick={() => onSave(week, supplements)}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
}
