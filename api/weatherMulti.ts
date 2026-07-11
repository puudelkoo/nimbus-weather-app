export type MultiCityInput = {
    id: string;
    country: string;
    city: string;
    lat: number;
    lon: number;
};

export type MultiCityCurrent = {
    id: string;
    country: string;
    city: string;
    lat: number;
    lon: number;
    temp: number | null;
    code: number | null;
    isDay: boolean | null;
};

export async function getWeatherMulti(cities: MultiCityInput[]): Promise<MultiCityCurrent[]> {
    const settled = await Promise.allSettled(
        cities.map(async (c) => {
            const params = new URLSearchParams({
                latitude: String(c.lat),
                longitude: String(c.lon),
                timezone: "auto",
                current: "temperature_2m,weather_code,is_day",
            });

            const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

            const res = await fetch(url, { cache: "no-store" });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`Open-Meteo error: ${res.status} ${text}`);
            }

            const data = await res.json();

            // Open-Meteo potrafi zwrócić błąd w JSON mimo 200
            if (data?.error) {
                throw new Error(`Open-Meteo error: ${data?.reason ?? "unknown"}`);
            }

            const t = data?.current?.temperature_2m;
            const code = data?.current?.weather_code;
            const d = data?.current?.is_day;

            return {
                ...c,
                temp: typeof t === "number" && Number.isFinite(t) ? Math.round(t) : null,
                code: typeof code === "number" && Number.isFinite(code) ? code : null,
                isDay: typeof d === "number" ? d === 1 : null,
            } as MultiCityCurrent;
        })
    );

    // zawsze zwracamy pełną listę w tej samej kolejności co cities
    return settled.map((r, i) => {
        if (r.status === "fulfilled") return r.value;

        console.error("city fetch failed:", cities[i].id, r.reason);

        return {
            ...cities[i],
            temp: null,
            code: null,
            isDay: null,
        } as MultiCityCurrent;
    });
}