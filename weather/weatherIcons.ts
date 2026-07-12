import { getAssetPath } from "@/utils/getAssetPath";

export type WeatherIconKey =
  | "sun-day"
  | "moon-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "rain"
  | "rain-heavy"
  | "drizzle"
  | "snow"
  | "thunderstorm"
  | "fog"
  | "wind"
  | "haze";

export const ICON_SRC: Record<WeatherIconKey, string> = {
  "sun-day": getAssetPath("/icons/weather/sun-day.png"),

  "moon-night": getAssetPath("/icons/weather/moon-night.png"),

  "partly-cloudy-day": getAssetPath("/icons/weather/partly-cloudy-day.png"),

  "partly-cloudy-night": getAssetPath("/icons/weather/partly-cloudy-night.png"),

  cloudy: getAssetPath("/icons/weather/cloudy.png"),

  rain: getAssetPath("/icons/weather/rain.png"),

  "rain-heavy": getAssetPath("/icons/weather/rain-heavy.png"),

  drizzle: getAssetPath("/icons/weather/drizzle.png"),

  snow: getAssetPath("/icons/weather/snow.png"),

  thunderstorm: getAssetPath("/icons/weather/thunderstorm.png"),

  fog: getAssetPath("/icons/weather/fog.png"),

  wind: getAssetPath("/icons/weather/wind.png") ,

  haze: getAssetPath("/icons/weather/haze.png"),
};

export function iconKeyFromWmo(
  code: number | null | undefined,
  isNight: boolean,
): WeatherIconKey {
  if (code == null || !Number.isFinite(code)) return "cloudy";
  const c = code;

  if (c === 0) return isNight ? "moon-night" : "sun-day";
  if (c === 1 || c === 2)
    return isNight ? "partly-cloudy-night" : "partly-cloudy-day";
  if (c === 3) return "cloudy";
  if (c === 45 || c === 48) return "fog";
  if (c === 51 || c === 53 || c === 55) return "drizzle";
  if (c === 56 || c === 57) return "drizzle";
  if (c === 61 || c === 63) return "rain";
  if (c === 65) return "rain-heavy";
  if (c === 66 || c === 67) return "rain-heavy";
  if (c === 71 || c === 73 || c === 75 || c === 77) return "snow";
  if (c === 80 || c === 81) return "rain";
  if (c === 82) return "rain-heavy";
  if (c === 95 || c === 96 || c === 99) return "thunderstorm";

  return "cloudy";
}

export function labelFromWmo(code: number | null | undefined): string {
  if (code == null || !Number.isFinite(code)) return "Brak danych";
  const c = code;

  if (c === 0) return "Bezchmurnie";
  if (c === 1) return "Prawie bezchmurnie";
  if (c === 2) return "Częściowe zachmurzenie";
  if (c === 3) return "Zachmurzenie";
  if (c === 45 || c === 48) return "Mgła";
  if (c === 51 || c === 53 || c === 55) return "Mżawka";
  if (c === 61 || c === 63) return "Deszcz";
  if (c === 65) return "Ulewa";
  if (c === 71 || c === 73 || c === 75 || c === 77) return "Śnieg";
  if (c === 80 || c === 81) return "Przelotne opady";
  if (c === 82) return "Silne opady";
  if (c === 95 || c === 96 || c === 99) return "Burza";

  return "Pogoda";
}
