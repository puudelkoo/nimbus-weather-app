"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { getWeatherMulti, type MultiCityCurrent } from "@/api/weatherMulti";
import { ICON_SRC, iconKeyFromWmo, labelFromWmo } from "@/weather/weatherIcons";
import { useLocation } from "@/context/LocationContext";
import { LARGE_CITIES, type CityItem } from "@/weather/largeCities";

export default function OtherLargeCities() {
  const { location, setLocation } = useLocation();

  const listRef = useRef<HTMLUListElement | null>(null);

  const [metrics, setMetrics] = useState({
    thumbTop: 0,
    thumbH: 28,
    canScroll: false,
  });

  const [rows, setRows] = useState<MultiCityCurrent[]>([]);
  const [loading, setLoading] = useState(true);

  const recalc = () => {
    const el = listRef.current;
    if (!el) return;

    const clientH = el.clientHeight;
    const scrollH = el.scrollHeight;
    const scrollTop = el.scrollTop;

    const canScroll = scrollH > clientH + 1;

    const trackH = clientH;

    const rawThumbH = (clientH / scrollH) * trackH;
    const thumbH = Math.max(24, Math.min(trackH, rawThumbH));

    const maxScroll = Math.max(1, scrollH - clientH);
    const maxThumbTop = Math.max(0, trackH - thumbH);
    const thumbTop = (scrollTop / maxScroll) * maxThumbTop;

    setMetrics({ thumbTop, thumbH, canScroll });
  };

  // 1 request dla wszystkich miast
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getWeatherMulti(LARGE_CITIES);
        if (alive) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("multi city error", e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  // scrollbar recalc
  useEffect(() => {
    recalc();

    const el = listRef.current;
    if (!el) return;

    const onScroll = () => recalc();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => recalc());
    ro.observe(el);

    const t = window.setTimeout(recalc, 0);

    return () => {
      window.clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // MERGE: zawsze renderuj listę cities, a dane wstrzyknij z rows
  const display = useMemo(() => {
    const byId = new Map(rows.map((row) => [row.id, row]));

    return LARGE_CITIES.map((city) => {
      const hit = byId.get(city.id);

      return {
        ...city,
        temp: hit?.temp ?? null,
        code: hit?.code ?? null,
        isDay: hit?.isDay ?? null,
      };
    });
  }, [rows]);

  const isSelected = (c: CityItem) => {
    // proste porównanie po współrzędnych (wystarczy)
    return (
      Math.abs(location.lat - c.lat) < 0.01 &&
      Math.abs(location.lon - c.lon) < 0.01
    );
  };

  useEffect(() => {
    const t = window.setTimeout(recalc, 0);

    return () => {
      window.clearTimeout(t);
    };
  }, [display.length, loading]);

  const selectCity = (c: CityItem) => {
    setLocation({
      name: c.city,
      country: c.country,
      lat: c.lat,
      lon: c.lon,
    });
  };

  return (
    <div className=" xl:col-span-4 min-[1780px]:col-span-3 flex flex-col rounded-2xl border border-surface/60 bg-surface/35 backdrop-blur p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inne duże miasta</h2>
        <div className="text-xs text-foreground/45">
          {loading ? "Ładowanie..." : "na żywo"}
        </div>
      </div>

      <div className="relative mt-4 group">
        <ul
          ref={listRef}
          className="space-y-3 overflow-y-auto pr-7 max-h-87.5 scroll-hide"
          onMouseEnter={recalc}
        >
          {display.map((c) => {
            const night = c.isDay === false;
            const iconKey = iconKeyFromWmo(c.code, night);
            const iconSrc = ICON_SRC[iconKey] ?? ICON_SRC["cloudy"];

            const selected = isSelected(c);

            return (
              <li
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => selectCity(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectCity(c);
                  }
                }}
                className={[
                  "flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors cursor-pointer outline-none",
                  selected
                    ? "border-accent/60 bg-surface/35"
                    : "border-surface/40 bg-surface/20 hover:border-accent/30",
                ].join(" ")}
                title={`Ustaw lokalizację: ${c.city}`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] text-foreground/45">
                    {c.country}
                  </div>
                  <div className="mt-0.5 text-sm font-medium truncate">
                    {c.city}
                  </div>

                  <div className="mt-0.5 text-xs text-foreground/45 truncate">
                    {c.code != null
                      ? labelFromWmo(c.code)
                      : loading
                        ? "Ładowanie..."
                        : "Brak danych"}
                  </div>
                </div>

                <div className="ml-5 flex items-center gap-3">
                  <Image
                    src={iconSrc}
                    alt=""
                    width={84}
                    height={84}
                    className="w-19 object-contain -translate-y-px"
                  />

                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {c.temp != null ? `${c.temp}°` : "--°"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {metrics.canScroll && (
          <div
            className="pointer-events-none absolute top-0 right-2 h-full w-1.25 rounded-full transition-opacity"
            style={{ backgroundColor: "rgba(201,179,126,0.14)" }}
          >
            <div
              className="absolute left-0 w-1.25 rounded-full"
              style={{
                top: metrics.thumbTop,
                height: metrics.thumbH,
                backgroundColor: "rgba(201,179,126,0.65)",
              }}
            />
          </div>
        )}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-background to-transparent rounded-b-2xl" />
      </div>
    </div>
  );
}
