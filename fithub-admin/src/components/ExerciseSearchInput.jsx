import { useCallback, useEffect, useRef, useState } from "react";
import { searchExercises } from "../lib/api";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

/**
 * Exercise autocomplete input.
 * Props:
 *   value: string (exercise name)
 *   onChange: (name: string, exercise?: object) => void
 *     Called with name string on typing, and full exercise object on selection
 *   placeholder: string
 */
export default function ExerciseSearchInput({ value, onChange, placeholder = "Egzersiz ara..." }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const wrapperRef = useRef(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([]); setLoading(false); return;
    }
    let cancelled = false;
    setLoading(true);
    searchExercises(debouncedQuery)
      .then((exercises) => { if (!cancelled) setResults(exercises ?? []); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => { setQuery(value || ""); }, [value]);

  const handleSelect = useCallback((exercise) => {
    const name = exercise.name || "";
    skipSearchRef.current = true;
    setQuery(name);
    setResults([]);
    setOpen(false);
    onChange(name, exercise);
  }, [onChange]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white shadow-xl max-h-56 overflow-auto py-1">
          {loading && <div className="px-3 py-2 text-sm text-gray-400">Aranıyor...</div>}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-2 text-sm text-gray-400">Sonuç bulunamadı — elle yazabilirsiniz</div>
          )}
          {!loading && results.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => handleSelect(ex)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition"
            >
              {ex.gif_url ? (
                <img src={ex.gif_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M6 4v16M18 4v16M6 12h12"/></svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">{ex.name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {[
                    ex.equipment && ex.equipment !== "Other" ? ex.equipment : null,
                    Array.isArray(ex.primary_muscles) ? ex.primary_muscles.join(", ") : ex.primary_muscles,
                  ].filter(Boolean).join(" · ") || ""}
                </div>
              </div>
              {ex.level && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                  ex.level === "beginner" ? "bg-green-50 text-green-600" :
                  ex.level === "intermediate" ? "bg-blue-50 text-blue-600" :
                  "bg-purple-50 text-purple-600"
                }`}>
                  {ex.level === "beginner" ? "Kolay" : ex.level === "intermediate" ? "Orta" : "Zor"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
