"use client";

import { createContext, useContext, useState } from "react";

export type Location = {
  name: string;
  country?: string;
  lat: number;
  lon: number;
};

type LocationContextType = {
  location: Location;
  setLocation: (l: Location) => void;
};

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  // startowa Warszawa
  const [location, setLocation] = useState<Location>({
    name: "Warszawa",
    country: "Polska",
    lat: 52.23,
    lon: 21.01,
  });

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation outside provider");
  return ctx;
}
