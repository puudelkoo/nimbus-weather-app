"use client";

import { useEffect, useState } from "react";
import { searchCities, type CityResult } from "@/api/citesApi";
import { useLocation } from "@/context/LocationContext";

export default function CitySearchInput() {
  const { setLocation } = useLocation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      return;
    }

    let alive = true;

    const t = setTimeout(async () => {
      try {
        const list = await searchCities(q);

        if (alive) setResults(list);
      } catch {
        if (alive) setResults([]);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  function pickCity(c: CityResult) {
    setLocation({
      name: c.name.split(",")[0],
      country: c.country,
      lat: c.lat,
      lon: c.lon,
    });

    setQuery("");
    setResults([]);
    setOpen(false);
  }

  const visibleResults = query.trim().length >= 2 ? results : [];

  return (
    <div className="relative w-full  md:w-72  lg:w-106 xl:w-142">
      {/* lupa */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/55"
        fill="none"
      >
        <path
          d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M16.6 16.6 21 21"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>

      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Szukaj miasta..."
        className="w-full rounded-full border border-surface/35 bg-surface/20 py-3.5 pl-11 pr-4 text-sm outline-none
        placeholder:text-foreground/45 focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
      />

      {open && visibleResults.length > 0 && (
        <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-surface/40 bg-surface/60 backdrop-blur">
          {visibleResults.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickCity(c)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-accent/10 transition-colors"
            >
              <div className="font-medium">{c.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
