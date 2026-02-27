import { useEffect, useState } from "react";
import Modal from "./Modal";

const DAYS = [
  { key: "mon", label: "Pzt", fullLabel: "Pazartesi" },
  { key: "tue", label: "Sal", fullLabel: "Salı" },
  { key: "wed", label: "Çar", fullLabel: "Çarşamba" },
  { key: "thu", label: "Per", fullLabel: "Perşembe" },
  { key: "fri", label: "Cum", fullLabel: "Cuma" },
  { key: "sat", label: "Cmt", fullLabel: "Cumartesi" },
  { key: "sun", label: "Paz", fullLabel: "Pazar" },
];

const CARDIO_TYPES = ["Koşu", "Yürüyüş", "Bisiklet", "HIIT", "İp Atlama", "Yüzme"];

const emptyConfig = () => ({ cardio_type: "Koşu", duration_min: "", notes: "" });

export default function CardioEditor({ open, onClose, sessions, onSave }) {
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [dayConfigs, setDayConfigs] = useState({});

  // Initialize from props when modal opens
  useEffect(() => {
    if (!open) return;

    const days = new Set();
    const configs = {};

    for (const s of sessions || []) {
      if (s.day_of_week) {
        days.add(s.day_of_week);
        configs[s.day_of_week] = {
          cardio_type: s.cardio_type || "Koşu",
          duration_min: s.duration_min || "",
          notes: s.notes || "",
        };
      }
    }

    setSelectedDays(days);
    setDayConfigs(configs);
  }, [open, sessions]);

  function toggleDay(key) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Ensure config exists for newly selected day
        if (!dayConfigs[key]) {
          setDayConfigs((c) => ({ ...c, [key]: emptyConfig() }));
        }
      }
      return next;
    });
  }

  function updateConfig(key, patch) {
    setDayConfigs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || emptyConfig()), ...patch },
    }));
  }

  function handleSave() {
    const result = DAYS.filter((d) => selectedDays.has(d.key)).map((d) => {
      const cfg = dayConfigs[d.key] || emptyConfig();
      return {
        day_of_week: d.key,
        cardio_type: cfg.cardio_type,
        duration_min: Number(cfg.duration_min) || 0,
        notes: cfg.notes || "",
      };
    });
    onSave(result);
  }

  return (
    <Modal open={open} onClose={onClose} title="Kardiyo Programı Düzenle">
      <div className="space-y-6">
        {/* Day selection grid */}
        <div>
          <div className="mb-2 text-sm font-semibold text-gray-900">Gün Seçimi</div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  selectedDays.has(d.key)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                ].join(" ")}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-day configuration */}
        <div className="space-y-4">
          {DAYS.filter((d) => selectedDays.has(d.key)).map((d) => {
            const cfg = dayConfigs[d.key] || emptyConfig();
            return (
              <div key={d.key} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 text-sm font-bold text-gray-900">{d.fullLabel}</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Kardiyo Tipi</div>
                    <select
                      value={cfg.cardio_type}
                      onChange={(e) => updateConfig(d.key, { cardio_type: e.target.value })}
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                    >
                      {CARDIO_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Süre</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={cfg.duration_min}
                        onChange={(e) => updateConfig(d.key, { duration_min: e.target.value })}
                        placeholder="30"
                        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                      />
                      <span className="text-sm text-gray-500">dk</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Not</div>
                    <input
                      type="text"
                      value={cfg.notes}
                      onChange={(e) => updateConfig(d.key, { notes: e.target.value })}
                      placeholder="Opsiyonel not"
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
}
