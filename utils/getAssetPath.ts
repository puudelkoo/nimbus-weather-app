const basePath =
  process.env.NODE_ENV === "production" ? "/nimbus-weather-app" : "";

export function getAssetPath(path: string) {
  return `${basePath}${path}`;
}
