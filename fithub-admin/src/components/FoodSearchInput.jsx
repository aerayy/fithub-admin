import { useCallback, useEffect, useRef, useState } from "react";
import { searchFoods } from "../lib/api";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export default function FoodSearchInput({ value, onSelect, placeholder = "Besin ara..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAllFoods, setShowAllFoods] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchFoods(debouncedQuery, { featuredOnly: !showAllFoods })
      .then((foods) => {
        if (!cancelled) setResults(foods ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, showAllFoods]);

  useEffect(() => {
    if (value) setQuery(displayName(value));
    else setQuery("");
  }, [value?.id, value?.name_tr, value?.name_en]);

  function displayName(food) {
    if (!food) return "";
    return food.name_tr || food.name_en || "";
  }

  const handleSelect = useCallback(
    (food) => {
      onSelect(food);
      setQuery(displayName(food));
      setResults([]);
      setOpen(false);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    onSelect(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  }, [onSelect]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-black/20">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Temizle"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>
      {open && (query.trim() || results.length > 0) && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-lg">
          <label className="flex items-center gap-2 border-b px-3 py-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAllFoods}
              onChange={(e) => setShowAllFoods(e.target.checked)}
              className="rounded border-gray-300"
            />
            Tüm besinleri göster
          </label>
          <ul className="max-h-48 overflow-auto py-1">
            {loading && (
              <li className="px-3 py-2 text-sm text-gray-500">Aranıyor...</li>
            )}
            {!loading && results.length === 0 && query.trim() && (
              <li className="px-3 py-2 text-sm text-gray-500">Sonuç bulunamadı</li>
            )}
            {!loading &&
              results.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(food)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  {food.name_tr || food.name_en}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
