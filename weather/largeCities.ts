export type CityItem = {
  id: string;
  country: string;
  city: string;
  lat: number;
  lon: number;
};




export const LARGE_CITIES: CityItem[] = [
    { id: "tokyo", country: "JP", city: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { id: "newyork", country: "US", city: "New York", lat: 40.7128, lon: -74.006 },
    { id: "london", country: "GB", city: "London", lat: 51.5072, lon: -0.1276 },
    { id: "paris", country: "FR", city: "Paris", lat: 48.8566, lon: 2.3522 },
    { id: "warsaw", country: "PL", city: "Warsaw", lat: 52.2297, lon: 21.0122 },
    { id: "sydney", country: "AU", city: "Sydney", lat: -33.8688, lon: 151.2077 },
    { id: "dubai", country: "AE", city: "Dubai", lat: 25.2048, lon: 55.2708 },
    { id: "singapore", country: "SG", city: "Singapore", lat: 1.3521, lon: 103.8198 },
    { id: "toronto", country: "CA", city: "Toronto", lat: 43.6548, lon: -79.3884 },
    { id: "berlin", country: "DE", city: "Berlin", lat: 52.52, lon: 13.405 },
    { id: "madrid", country: "ES", city: "Madrid", lat: 40.4168, lon: -3.7033 },
    { id: "oslo", country: "NO", city: "Oslo", lat: 59.9122, lon: 10.7313 },
  ];