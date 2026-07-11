export type CityResult = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country?: string;
};

type OpenMeteoCity = {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  admin1?: string;
  country?: string;
};

type OpenMeteoCitiesResponse = {
  results?: OpenMeteoCity[];
};

export async function searchCities(query: string): Promise<CityResult[]> {
  const q = query.trim();

  if (q.length < 2) return [];

  const url =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    new URLSearchParams({
      name: q,
      count: "10",
      language: "pl",
      format: "json",
    }).toString();

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`City search failed: ${res.status}`);
  }

  const data: OpenMeteoCitiesResponse = await res.json();
  const results = data.results ?? [];

  return results
    .filter((r) => {
      return (
        typeof r.name === "string" &&
        typeof r.latitude === "number" &&
        typeof r.longitude === "number" &&
        Number.isFinite(r.latitude) &&
        Number.isFinite(r.longitude)
      );
    })
    .map((r) => {
      const labelParts = [r.name, r.admin1, r.country].filter(Boolean);

      return {
        id: r.id ? String(r.id) : `${r.latitude},${r.longitude},${r.name}`,
        name: labelParts.join(", "),
        lat: r.latitude as number,
        lon: r.longitude as number,
        country: r.country,
      };
    });
}
