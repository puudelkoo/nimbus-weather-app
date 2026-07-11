"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getWeather } from "@/api/weatherApi";
import { useLocation } from "@/context/LocationContext";
import { ICON_SRC, iconKeyFromWmo, labelFromWmo } from "@/weather/weatherIcons";
import { getAirQuality, type AirQualityData } from "@/api/airQualityApi";

type Tab = "today" | "tomorrow" | "week";
type Mode = "forecast" | "air";

type HourPoint = {
  h: string; // "12", "15", ...
  t: number; // temperatura
  p: number; // opad %
};

type WeatherData = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    weather_code?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    precipitation_probability_max?: number[];
  };
};

export default function ForecastPanel() {
  const [tab, setTab] = useState<Tab>("today");
  const [mode, setMode] = useState<Mode>("forecast");

  const tabs = [
    { id: "today", label: "Dzisiaj" },
    { id: "tomorrow", label: "Jutro" },
    { id: "week", label: "7 dni" },
  ] as const;

  const dayNamesPL = [
    "Niedziela",
    "Poniedziałek",
    "Wtorek",
    "Środa",
    "Czwartek",
    "Piątek",
    "Sobota",
  ];

  const today = new Date();
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const [activeDay, setActiveDay] = useState(0);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [airLoading, setAirLoading] = useState(true);
  const { location } = useLocation();

  useEffect(() => {
    let alive = true;

    async function loadWeather() {
      if (alive) setLoading(true);

      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) {
        if (alive) setLoading(false);
        return;
      }

      try {
        const data = await getWeather(location.lat, location.lon);
        if (alive) setWeather(data);
      } catch (e) {
        console.error("Weather error", e);
        if (alive) setWeather(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadWeather();

    return () => {
      alive = false;
    };
  }, [location.lat, location.lon]);

  useEffect(() => {
    let alive = true;

    async function loadAirQuality() {
      if (alive) setAirLoading(true);

      if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) {
        if (alive) setAirLoading(false);
        return;
      }

      try {
        const data = await getAirQuality(location.lat, location.lon);
        if (alive) setAirQuality(data);
      } catch (e) {
        console.error("Air quality error", e);
        if (alive) setAirQuality(null);
      } finally {
        if (alive) setAirLoading(false);
      }
    }

    loadAirQuality();

    return () => {
      alive = false;
    };
  }, [location.lat, location.lon]);

  const round = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;

  function getDaily(i: number) {
    const max = round(weather?.daily?.temperature_2m_max?.[i]);
    const min = round(weather?.daily?.temperature_2m_min?.[i]);

    const code =
      typeof weather?.daily?.weather_code?.[i] === "number"
        ? weather.daily.weather_code[i]
        : null;

    const rain = round(weather?.daily?.precipitation_probability_max?.[i]);

    return {
      max,
      min,
      code,
      rain,
      icon: iconKeyFromWmo(code, false),
      label: labelFromWmo(code),
    };
  }

  const hourly: HourPoint[] = useMemo(() => {
    const times: string[] = weather?.hourly?.time ?? [];
    const temps: number[] = weather?.hourly?.temperature_2m ?? [];
    const pops: number[] = weather?.hourly?.precipitation_probability ?? [];

    if (!times.length) return [];

    const currentRaw = weather?.current?.time;

    const currentHour =
      typeof currentRaw === "string" && currentRaw.length >= 13
        ? `${currentRaw.slice(0, 13)}:00`
        : null;

    let startIndex = currentHour
      ? times.findIndex((time) => time === currentHour)
      : -1;

    if (startIndex < 0 && currentHour) {
      startIndex = times.findIndex((time) => time > currentHour);
    }

    if (startIndex < 0) {
      startIndex = 0;
    }

    const currentTemp = weather?.current?.temperature_2m;

    return times
      .slice(startIndex, startIndex + 25)
      .map((time, offset) => {
        const i = startIndex + offset;

        const hourlyTemp =
          typeof temps[i] === "number" && Number.isFinite(temps[i])
            ? Math.round(temps[i])
            : null;

        const temp =
          offset === 0 &&
          typeof currentTemp === "number" &&
          Number.isFinite(currentTemp)
            ? Math.round(currentTemp)
            : hourlyTemp;

        const pop =
          typeof pops[i] === "number" && Number.isFinite(pops[i])
            ? Math.round(pops[i])
            : 0;

        if (temp === null) return null;

        return {
          h: offset === 0 ? "Teraz" : time.slice(11, 13),
          t: temp,
          p: pop,
        };
      })
      .filter((point): point is HourPoint => point !== null);
  }, [weather]);

  // --- jutro: 4 pory dnia z hourly ---
  const tomorrowParts = useMemo(() => {
    const times: string[] = weather?.hourly?.time ?? [];
    const temps: number[] = weather?.hourly?.temperature_2m ?? [];
    const pops: number[] = weather?.hourly?.precipitation_probability ?? [];
    const codes: number[] = weather?.hourly?.weather_code ?? [];

    if (!times.length) return null;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const idx = times.findIndex(
      (t) => new Date(t).getTime() >= tomorrow.getTime(),
    );

    if (idx < 0) return null;

    const avgSlice = (arr: number[], start: number, len: number) => {
      const slice = arr
        .slice(start, start + len)
        .filter((x) => Number.isFinite(x));

      if (!slice.length) return null;

      return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
    };

    const maxSlice = (arr: number[], start: number, len: number) => {
      const slice = arr
        .slice(start, start + len)
        .filter((x) => Number.isFinite(x));

      if (!slice.length) return null;

      return Math.round(Math.max(...slice));
    };

    const modeSlice = (arr: number[], start: number, len: number) => {
      const slice = arr
        .slice(start, start + len)
        .filter((x) => Number.isFinite(x));

      if (!slice.length) return null;

      const counts = new Map<number, number>();

      slice.forEach((code) => {
        counts.set(code, (counts.get(code) ?? 0) + 1);
      });

      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    };

    const makePart = (start: number, len: number, isNight: boolean) => {
      const code = modeSlice(codes, start, len);

      return {
        t: avgSlice(temps, start, len),
        p: maxSlice(pops, start, len),
        code,
        isNight,
        icon: iconKeyFromWmo(code, isNight),
        label: labelFromWmo(code),
      };
    };

    return [
      makePart(idx + 6, 6, false), // 06-11
      makePart(idx + 12, 6, false), // 12-17
      makePart(idx + 18, 4, false), // 18-21
      makePart(idx + 22, 6, true), // 22-05
    ];
  }, [weather]);
  if (loading) {
    return (
      <div className="xl:col-span-8 min-[1780px]:col-span-9 p-6">
        Ładowanie pogody...
      </div>
    );
  }

  return (
    <div className=" xl:col-span-8 min-[1780px]:col-span-9 flex flex-col rounded-2xl border border-surface/60 bg-surface/35 backdrop-blur p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {mode === "air" ? (
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold tracking-tight">
                Aktualna jakość powietrza
              </h2>
              <p className="mt-1 text-xs text-foreground/50">
                Dane dla wybranej lokalizacji
              </p>
            </div>
          ) : (
            <div className="grid h-11 w-full grid-cols-3 rounded-full border border-surface/40 bg-surface/20 p-1 text-xs font-medium sm:flex sm:h-auto sm:w-auto sm:items-center sm:gap-8 sm:border-0 sm:bg-transparent sm:p-0 sm:text-sm">
              {tabs.map((t) => {
                const active = tab === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative flex h-full items-center justify-center rounded-full px-3 text-center whitespace-nowrap transition-colors sm:block sm:h-auto sm:px-0 sm:py-0 sm:pb-1 ${
                      active
                        ? "bg-highlight text-background sm:bg-transparent sm:text-foreground"
                        : "text-foreground/55 hover:text-accent"
                    }`}
                  >
                    {t.label}

                    {active && (
                      <span className="absolute left-0 -bottom-1 hidden h-1 w-full rounded-full bg-accent sm:block" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid h-11 w-full grid-cols-2 rounded-full border border-surface/40 bg-surface/20 p-1 sm:flex sm:h-auto sm:w-fit">
          <button
            type="button"
            onClick={() => setMode("forecast")}
            style={
              mode === "forecast"
                ? {
                    backgroundColor: "var(--highlight)",
                    color: "var(--background)",
                  }
                : {}
            }
            className={`flex h-full items-center justify-center rounded-full px-3 text-xs font-medium transition-colors sm:h-auto sm:px-4 sm:py-1.5 ${
              mode === "forecast" ? "" : "text-foreground/45 hover:text-accent"
            }`}
          >
            Prognoza
          </button>

          <button
            type="button"
            onClick={() => setMode("air")}
            style={
              mode === "air"
                ? {
                    backgroundColor: "var(--highlight)",
                    color: "var(--background)",
                  }
                : {}
            }
            className={`flex h-full items-center justify-center rounded-full px-3 text-xs font-medium transition-colors sm:h-auto sm:px-4 sm:py-1.5 ${
              mode === "air" ? "" : "text-foreground/45 hover:text-accent"
            }`}
          >
            Jakość powietrza
          </button>
        </div>
      </div>

      {/* Content */}
      {mode === "air" ? (
        <AirQualityView
          data={airQuality}
          loading={airLoading}
          cityName={location.name}
        />
      ) : tab === "tomorrow" ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Przedpołudnie" },
            { label: "Popołudnie" },
            { label: "Wieczór" },
            { label: "Noc" },
          ].map((item, i) => {
            const part = tomorrowParts?.[i];

            return (
              <div
                key={`tomorrow-${i}`}
                className="mx-auto aspect-square w-full max-w-56 rounded-2xl border border-surface/30 bg-surface/20 p-4 flex flex-col items-center justify-center text-center"
              >
                <div className="text-lg font-semibold text-foreground/90">
                  {item.label}
                </div>

                {part?.icon && (
                  <div className="relative mt-4 h-16 w-16">
                    <Image
                      src={ICON_SRC[part.icon]}
                      alt={part.label}
                      fill
                      className="object-contain scale-[2.1]"
                    />
                  </div>
                )}

                <div className="mt-2 text-3xl font-semibold">
                  {part?.t != null ? `${part.t}°` : "--°"}
                </div>

                <div className="mt-1 text-xs text-foreground/60">
                  Opad: {part?.p != null ? `${part.p}%` : "--%"}
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === "week" ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {next7.map((d, i) => {
            const dayLabel = dayNamesPL[d.getDay()];
            const big = activeDay === i;
            const day = getDaily(i);

            return (
              <div
                key={`week-${d.toDateString()}`}
                onClick={() => setActiveDay(i)}
                onDoubleClick={() => {
                  if (activeDay === i) setActiveDay(0);
                }}
                className={`rounded-2xl border transition-all duration-300 cursor-pointer ${
                  big
                    ? "md:col-span-2 border-surface/30 bg-surface/20 p-4 h-56"
                    : "border-surface/25 bg-surface/15 p-3 hover:border-accent/30 h-56"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={
                      big
                        ? "text-sm font-semibold text-foreground/85"
                        : "text-xs font-semibold text-foreground/75"
                    }
                  >
                    {dayLabel}
                  </div>

                  {i === 0 && (
                    <div className="text-[10px] text-foreground/45">Dziś</div>
                  )}
                </div>

                <div className="flex h-33 flex-col items-center justify-center pt-3 text-center">
                  <div className="relative h-30 w-30 translate-y-1">
                    <Image
                      src={ICON_SRC[day.icon]}
                      alt={day.label}
                      fill
                      className="object-contain scale-[2.1]"
                    />
                  </div>

                  <div
                    className={
                      big
                        ? "mt-3 text-4xl font-semibold"
                        : "mt-3 text-2xl font-semibold"
                    }
                  >
                    {day.max != null && day.min != null
                      ? `${day.max}° / ${day.min}°`
                      : "--°"}
                  </div>

                  <div
                    className={
                      big
                        ? "mt-2 text-sm italic text-foreground/70"
                        : "mt-1 text-xs italic text-foreground/60"
                    }
                  >
                    {day.label}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>Opad</span>
                    <span>{day.rain != null ? `${day.rain}%` : "--%"}</span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-surface/35">
                    <div
                      className="h-full rounded-full bg-highlight/70"
                      style={{
                        width: `${Math.min(Math.max(day.rain ?? 0, 0), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-2">
          {/* szybki podgląd teraz */}
          <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Teraz",
                value: round(weather?.current?.temperature_2m),
                suffix: "°",
              },
              {
                label: "Ciśnienie",
                value: round(weather?.current?.pressure_msl),
                suffix: " hPa",
              },
              {
                label: "Wiatr",
                value: round(weather?.current?.wind_speed_10m),
                suffix: " km/h",
              },
              {
                label: "Wilgotność",
                value: round(weather?.current?.relative_humidity_2m),
                suffix: "%",
              },
            ].map((item, i) => (
              <div
                key={`now-${i}`}
                className="rounded-2xl border border-surface/30 bg-surface/20 px-4 py-3"
              >
                <div className="text-xs text-foreground/70">{item.label}</div>
                <div className="mt-1 text-lg font-semibold">
                  {item.value ?? "--"}
                  {item.value != null ? item.suffix : ""}
                </div>
              </div>
            ))}
          </div>

          <HourlyChart data={hourly} />
        </div>
      )}
    </div>
  );
}

function HourlyChart({ data }: { data: HourPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-surface/30 bg-surface/20 p-4 text-sm text-foreground/60">
        Brak danych godzinowych
      </div>
    );
  }

  const W = 1200;
  const H = 150;

  const padX = 28;
  const padTop = 24;
  const padBottom = 36;

  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;

  const temps = data.map((d) => d.t);
  const precs = data.map((d) => d.p);

  const tMin = Math.min(...temps);
  const tMax = Math.max(...temps);
  const pMax = Math.max(1, ...precs);

  const x = (i: number) => padX + (innerW * i) / Math.max(1, data.length - 1);

  const tempTop = padTop + 4;
  const tempBottom = padTop + innerH * 0.68;

  const yT = (t: number) => {
    const r = (t - tMin) / (tMax - tMin || 1);
    return tempBottom - r * (tempBottom - tempTop);
  };

  const barTop = padTop + innerH * 0.78;
  const barBottom = padTop + innerH;

  const yP = (p: number) => {
    const r = p / pMax;
    return barBottom - r * (barBottom - barTop);
  };

  const pts = data.map((d, i) => ({
    x: x(i),
    y: yT(d.t),
  }));

  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath =
    `M ${pts[0].x} ${tempBottom} ` +
    pts.map((p) => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${pts[pts.length - 1].x} ${tempBottom} Z`;

  const barW = Math.max(8, Math.min(34, innerW / data.length - 10));

  return (
    <div className="chart-scroll mt-4 w-full overflow-x-auto overflow-y-hidden pb-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-[170px] w-[920px] md:h-[190px] md:w-[1050px] xl:h-[170px] xl:w-[1180px] min-[1780px]:h-auto min-[1780px]:w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={padX}
          y1={tempBottom}
          x2={W - padX}
          y2={tempBottom}
          stroke="rgba(230,227,221,0.08)"
        />

        <line
          x1={padX}
          y1={barTop}
          x2={W - padX}
          y2={barTop}
          stroke="rgba(230,227,221,0.06)"
        />

        <path d={areaPath} fill="url(#tempFill)" />

        {data.map((d, i) => {
          const barY = yP(d.p);
          const showPercent = d.p >= 30;

          return (
            <g key={`p-${i}`}>
              <rect
                x={x(i) - barW / 2}
                y={barY}
                width={barW}
                height={barBottom - barY}
                rx={5}
                fill="var(--highlight)"
                opacity={0.35}
              />

              {showPercent && (
                <text
                  x={x(i)}
                  y={barBottom - 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="rgba(230,227,221,0.65)"
                >
                  {d.p}%
                </text>
              )}
            </g>
          );
        })}

        <polyline
          points={linePoints}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.95}
        />

        {data.map((d, i) => (
          <g key={`t-${i}`}>
            <circle
              cx={x(i)}
              cy={yT(d.t)}
              r="3.5"
              fill="var(--accent)"
              opacity={0.95}
            />

            <text
              x={x(i)}
              y={yT(d.t) - 10}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(230,227,221,0.78)"
            >
              {d.t}°
            </text>

            <text
              x={x(i)}
              y={H - 10}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(230,227,221,0.5)"
            >
              {d.h}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function getAqiInfo(aqi: number | null) {
  if (aqi == null) {
    return {
      label: "Brak danych",
      description: "Nie udało się pobrać aktualnej jakości powietrza.",
    };
  }

  if (aqi <= 20) {
    return {
      label: "Bardzo dobra",
      description:
        "Powietrze jest bardzo czyste. Dobry moment na aktywność na zewnątrz.",
    };
  }

  if (aqi <= 40) {
    return {
      label: "Dobra",
      description: "Jakość powietrza jest dobra dla większości osób.",
    };
  }

  if (aqi <= 60) {
    return {
      label: "Umiarkowana",
      description:
        "Osoby wrażliwe mogą odczuwać lekki dyskomfort przy dłuższym wysiłku.",
    };
  }

  if (aqi <= 80) {
    return {
      label: "Zła",
      description:
        "Warto ograniczyć dłuższą aktywność na zewnątrz, szczególnie przy wrażliwości na smog.",
    };
  }

  if (aqi <= 100) {
    return {
      label: "Bardzo zła",
      description: "Lepiej unikać długiego wysiłku na zewnątrz.",
    };
  }

  return {
    label: "Ekstremalnie zła",
    description: "Najlepiej ograniczyć przebywanie na zewnątrz do minimum.",
  };
}

function cleanValue(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

function getPollutantWidth(value: number | null, max: number) {
  if (value == null) return 0;
  return Math.min(Math.max((value / max) * 100, 0), 100);
}

function AirQualityView({
  data,
  loading,
  cityName,
}: {
  data: AirQualityData | null;
  loading: boolean;
  cityName: string;
}) {
  if (loading) {
    return (
      <div className="mt-5 rounded-2xl border border-surface/30 bg-surface/20 p-5 text-sm text-foreground/60">
        Ładowanie jakości powietrza...
      </div>
    );
  }

  const current = data?.current;
  const units = data?.current_units ?? {};

  const aqi = cleanValue(current?.european_aqi);
  const info = getAqiInfo(aqi);

  const pollutants = [
    {
      label: "PM2.5",
      value: cleanValue(current?.pm2_5),
      unit: units.pm2_5 ?? "µg/m³",
      description: "drobny pył",
      max: 50,
    },
    {
      label: "PM10",
      value: cleanValue(current?.pm10),
      unit: units.pm10 ?? "µg/m³",
      description: "większy pył",
      max: 100,
    },
    {
      label: "NO₂",
      value: cleanValue(current?.nitrogen_dioxide),
      unit: units.nitrogen_dioxide ?? "µg/m³",
      description: "spaliny",
      max: 100,
    },
    {
      label: "O₃",
      value: cleanValue(current?.ozone),
      unit: units.ozone ?? "µg/m³",
      description: "ozon",
      max: 180,
    },
  ];

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="lg:col-span-5 rounded-2xl border border-surface/30 bg-surface/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-foreground/55">
              Wybrana lokalizacja
            </div>

            <div className="mt-1 text-sm font-medium text-foreground/80">
              {cityName}
            </div>
          </div>

          <div className="rounded-full border border-surface/30 px-3 py-1 text-xs text-foreground/60">
            EAQI
          </div>
        </div>

        <div className="mt-4">
          <div className="text-6xl font-semibold tracking-tight">
            {aqi ?? "--"}
          </div>

          <div className="mt-2 text-xl font-semibold text-foreground/85">
            {info.label}
          </div>

          <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/60">
            {info.description}
          </p>
        </div>
      </div>

      <div className="lg:col-span-7 grid grid-cols-2 gap-3">
        {pollutants.map((item) => {
          const width = getPollutantWidth(item.value, item.max);

          return (
            <div
              key={item.label}
              className="h-24 rounded-2xl border border-surface/30 bg-surface/20 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground/85">
                    {item.label}
                  </div>

                  <div className="mt-1 text-xs italic text-foreground/55">
                    {item.description}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-semibold leading-none">
                    {item.value ?? "--"}
                  </div>

                  <div className="mt-1 text-[10px] font-medium text-foreground/55">
                    {item.value != null ? item.unit : ""}
                  </div>
                </div>
              </div>

              <div>
                <div className="h-2 rounded-full bg-surface/40">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      background: "var(--highlight)",
                      opacity: 0.75,
                    }}
                  />
                </div>

                <div className="mt-1 flex justify-between text-[10px] font-medium text-foreground/35">
                  <span>Nisko</span>
                  <span>Wysoko</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
