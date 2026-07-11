"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@/context/LocationContext";
import { getWeather } from "@/api/weatherApi";

type WeatherData = {
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
  };
};

export default function ChanceOfRain() {
  const { location } = useLocation();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTabletView, setIsTabletView] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(min-width: 768px) and (max-width: 1279px)",
    );

    const update = () => {
      setIsTabletView(media.matches);
    };

    update();

    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        const data = await getWeather(location.lat, location.lon);

        if (alive) setWeather(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [location.lat, location.lon]);

  const { hours, rain } = useMemo(() => {
    const times: string[] = weather?.hourly?.time ?? [];
    const pops: number[] = weather?.hourly?.precipitation_probability ?? [];
    if (!times.length || !pops.length)
      return { hours: [] as number[], rain: [] as number[] };

    const now = Date.now();
    const start = times.findIndex((t) => new Date(t).getTime() >= now);
    const s = start >= 0 ? start : 0;

    // chcemy 6 punktów co 2h (12h)
    const offsets = [0, 2, 4, 6, 8, 10];

    const out: { h: number; p: number }[] = [];

    for (const off of offsets) {
      const idx = s + off;
      if (idx >= times.length || idx >= pops.length) break;

      const h = new Date(times[idx]).getHours();
      const p = pops[idx];

      if (!Number.isFinite(h) || !Number.isFinite(p)) continue;

      out.push({ h, p: Math.round(p) });
    }

    // jak nie mamy sensownych danych, zwróć pusto
    if (out.length < 2) return { hours: [] as number[], rain: [] as number[] };

    return {
      hours: out.map((x) => x.h),
      rain: out.map((x) => x.p),
    };
  }, [weather]);

  const rainMeta = useMemo(() => {
    const times: string[] = weather?.hourly?.time ?? [];
    const pops: number[] = weather?.hourly?.precipitation_probability ?? [];
    if (!times.length || !pops.length) return null;

    const now = Date.now();
    const start = times.findIndex((t) => new Date(t).getTime() >= now);
    const s = start >= 0 ? start : 0;

    const windowHours = 12;
    const sliceTimes = times.slice(s, s + windowHours);
    const slicePops = pops
      .slice(s, s + windowHours)
      .map((v) => Math.round(v ?? 0));

    if (!sliceTimes.length) return null;

    // peak
    let peakIdx = 0;
    let peakVal = -1;
    slicePops.forEach((v, i) => {
      if (Number.isFinite(v) && v > peakVal) {
        peakVal = v;
        peakIdx = i;
      }
    });

    // window opadów (threshold)
    const threshold = 20; // możesz ustawić 15/25
    const activeIdx = slicePops
      .map((v, i) => ({ v, i }))
      .filter((x) => x.v >= threshold)
      .map((x) => x.i);

    if (!activeIdx.length) {
      return {
        peak: {
          idx: peakIdx,
          val: Math.max(0, peakVal),
          hour: new Date(sliceTimes[peakIdx]).getHours(),
        },
        window: null,
        nowVal: slicePops[0],
      };
    }

    const first = activeIdx[0];
    const last = activeIdx[activeIdx.length - 1];

    const startHour = new Date(sliceTimes[first]).getHours();
    const endHour = new Date(sliceTimes[last]).getHours();

    // +1 bo liczysz godziny inkluzywnie (np 14..17 = 4h)
    const durationHours = last - first + 1;

    return {
      peak: {
        idx: peakIdx,
        val: Math.max(0, peakVal),
        hour: new Date(sliceTimes[peakIdx]).getHours(),
      },
      window: { startHour, endHour, durationHours },
      nowVal: slicePops[0],
    };
  }, [weather]);

  const hasData =
    rain.length >= 2 &&
    hours.length >= 2 &&
    rain.every((v) => Number.isFinite(v));

  const maxVal = hasData ? Math.max(...rain) : 0;

  // FIX: yMax nie może być 0, bo SVG dostanie NaN (dzielenie przez 0)
  const yMax =
    !hasData || maxVal <= 0
      ? 100
      : Math.min(100, Math.ceil((maxVal + maxVal * 0.2) / 10) * 10);

  const maxIdx = hasData ? rain.indexOf(maxVal) : 0;
  const maxHour = hasData ? hours[maxIdx] : 0;

  // 00 -> 24
  const formatHour = (h: number) =>
    h === 0 ? "24" : String(h).padStart(2, "0");

  const W = isTabletView ? 740 : 420;
  const H = 150;

  const padLeft = isTabletView ? 32 : 22;
  const padRight = isTabletView ? 18 : 10;
  const padTop = 14;
  const padBottom = 24;

  const edgeInset = isTabletView ? 6 : 14;

  const plotLeft = padLeft + edgeInset;
  const plotRight = padRight + edgeInset;

  const innerW = W - plotLeft - plotRight;
  const innerH = H - padTop - padBottom;

  const edgeGap = isTabletView ? 34 : 18; // regulacja ile do odsuniecia

  const barWidth = isTabletView ? 9 : 8;

  const y = (percent: number) => padTop + innerH - (percent / yMax) * innerH;

  const getRainSummary = () => {
    const nowRain = hasData ? rain[0] : 0;

    if (!hasData) return loading ? "Ładowanie..." : "Brak danych";
    const nearlyNow = nowRain >= maxVal - 10; // tolerancja 10%
    if (maxVal < 20) {
      return nearlyNow
        ? `Mała szansa opadu teraz (${nowRain}%)`
        : `Mała szansa opadu ok. ${formatHour(maxHour)}:00 (${maxVal}%)`;
    }

    if (maxVal < 50) {
      return nearlyNow
        ? `Możliwy przelotny opad teraz (${nowRain}%)`
        : `Możliwy przelotny opad ok. ${formatHour(maxHour)}:00 (${maxVal}%)`;
    }

    return nearlyNow
      ? `Wysoka szansa opadu teraz (${nowRain}%)`
      : `Wysoka szansa opadu ok. ${formatHour(maxHour)}:00 (${maxVal}%)`;
  };

  const peakText = !rainMeta
    ? "--"
    : rainMeta.peak.idx === 0
      ? `Szczyt opadów teraz (${rainMeta.peak.val}%)`
      : `Szczyt opadów ok. ${formatHour(rainMeta.peak.hour)}:00 (${rainMeta.peak.val}%)`;

  const windowText = !rainMeta
    ? "--"
    : !rainMeta.window
      ? "Brak istotnych opadów w najbliższych 12h"
      : rainMeta.window.durationHours <= 1
        ? `Możliwy opad przez ok. 1 godz. (ok. ${formatHour(rainMeta.window.startHour)}:00)`
        : `Możliwe opady ok. ${formatHour(rainMeta.window.startHour)}:00–${formatHour(rainMeta.window.endHour)}:00 (${rainMeta.window.durationHours} godz.)`;

  const rainSummary = getRainSummary();

  return (
    <div className=" xl:col-span-4 min-[1780px]:col-span-3 flex flex-col rounded-2xl border border-surface/60 bg-surface/35 backdrop-blur p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Szansa na opady</h2>
        <span className="text-xs text-foreground/45">najbliższe 12h</span>
      </div>

      <div className="mt-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-42 w-full"
          preserveAspectRatio={isTabletView ? "none" : "xMidYMid meet"}
        >
          {/* linie + etykiety */}
          {Array.from(new Set([0, yMax / 2, yMax])).map((p, idx) => {
            const lineY = y(p);
            return (
              <g key={`grid-${idx}-${p}`}>
                <line
                  x1={plotLeft}
                  x2={W - plotRight}
                  y1={lineY}
                  y2={lineY}
                  stroke="rgba(230,227,221,0.08)"
                />
                <text
                  x={2}
                  y={lineY + 4}
                  fontSize="10"
                  fill="rgba(230,227,221,0.38)"
                >
                  {Math.round(p)}%
                </text>
              </g>
            );
          })}

          {/* ZMIENIONE: zawsze rysujemy 6 tracków i liczymy X po tych 6 slotach */}
          {(() => {
            const slots = 6;

            // lokalny X liczony zawsze dla 6 słupków (żeby nie zależeć od rain.length)
            const denomSlots = Math.max(1, slots - 1);
            const xSlot = (i: number) =>
              plotLeft + edgeGap + ((innerW - edgeGap * 2) * i) / denomSlots;

            const safeRain =
              rain.length === slots
                ? rain
                : Array.from({ length: slots }, (_, i) =>
                    Number.isFinite(rain[i]) ? (rain[i] as number) : 0,
                  );

            const safeHours =
              hours.length === slots
                ? hours
                : Array.from({ length: slots }, (_, i) =>
                    Number.isFinite(hours[i]) ? (hours[i] as number) : NaN,
                  );

            return safeRain.map((value, i) => {
              const barX = xSlot(i) - barWidth / 2;
              const barY = y(value);

              const hourLabel =
                i === 0
                  ? "Teraz"
                  : Number.isFinite(safeHours[i])
                    ? formatHour(safeHours[i] as number)
                    : "";

              const fullTop = y(yMax);
              const fullHeight = padTop + innerH - fullTop;

              return (
                <g key={`bar-${i}`}>
                  {/* % nad słupkiem: tylko gdy masz dane i >0 */}
                  {hasData && value > 0 && (
                    <text
                      x={xSlot(i)}
                      y={barY - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fill="rgba(230,227,221,0.65)"
                    >
                      {value}%
                    </text>
                  )}

                  {/* tło do 100% (track) - zawsze */}
                  <rect
                    x={barX}
                    y={fullTop}
                    width={barWidth}
                    height={fullHeight}
                    rx={6}
                    fill="var(--highlight)"
                    opacity={0.18}
                  />

                  {/* właściwy słupek - tylko gdy > 0 i masz dane */}
                  {hasData && value > 0 && (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={padTop + innerH - barY}
                      rx={6}
                      fill="var(--highlight)"
                      opacity={1}
                    />
                  )}

                  {/* godzina */}
                  <text
                    x={xSlot(i)}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill="rgba(230,227,221,0.5)"
                  >
                    {hourLabel}
                  </text>
                </g>
              );
            });
          })()}
        </svg>
      </div>

      {/* dół: jedna sensowna linijka zamiast dwóch kart */}
      <div className="mt-1.5 text-base font-semibold">{rainSummary}</div>

      <div className="mt-3 space-y-1 text-sm text-foreground/65">
        <div>{peakText}</div>
        <div>{windowText}</div>
      </div>
    </div>
  );
}
