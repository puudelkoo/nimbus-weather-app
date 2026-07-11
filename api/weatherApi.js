const buildMeteoUrl = (lat, lon) => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    current:
      "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily:
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
};

export async function getWeather(lat, lon) {
  // 1) blokada na śmieciowe koordynaty
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid coords: lat=${lat}, lon=${lon}`);
  }

  const url = buildMeteoUrl(lat, lon);

  // 2) tak samo jak w multi: no-store
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Weather API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // 3) Open-Meteo czasem zwraca error w JSON mimo 200
  if (data?.error) {
    throw new Error(`Open-Meteo error: ${data?.reason ?? "unknown"}`);
  }

  return data;
}
