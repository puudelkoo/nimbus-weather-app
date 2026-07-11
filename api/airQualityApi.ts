export type AirQualityData = {
  current?: {
    time?: string;
    european_aqi?: number;
    pm10?: number;
    pm2_5?: number;
    nitrogen_dioxide?: number;
    ozone?: number;
  };
  current_units?: Record<string, string>;
};

const buildAirQualityUrl = (lat: number, lon: number) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    current: "european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone",
  });

  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
};

export async function getAirQuality(
  lat: number,
  lon: number,
): Promise<AirQualityData> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid coords: lat=${lat}, lon=${lon}`);
  }

  const res = await fetch(buildAirQualityUrl(lat, lon), {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Air Quality API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (data?.error) {
    throw new Error(
      `Open-Meteo Air Quality error: ${data?.reason ?? "unknown"}`,
    );
  }

  return data;
}
