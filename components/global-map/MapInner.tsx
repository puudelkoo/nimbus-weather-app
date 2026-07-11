"use client";

import { useEffect } from "react";
import type { LatLngExpression } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import { useLocation } from "@/context/LocationContext";
import { LARGE_CITIES } from "@/weather/largeCities";

function isSamePlace(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  return Math.abs(a.lat - b.lat) < 0.15 && Math.abs(a.lon - b.lon) < 0.15;
}

function MapViewUpdater({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), {
      animate: true,
    });
  }, [center, map]);

  return null;
}

export default function MapInner() {
  const { location, setLocation } = useLocation();

  const center: LatLngExpression = [location.lat, location.lon];

  const currentCityIsLargeCity = LARGE_CITIES.some((city) =>
    isSamePlace(city, location),
  );

  return (
    <MapContainer
      center={center}
      zoom={4}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <MapViewUpdater center={center} />

      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />

      {LARGE_CITIES.map((city) => {
        const isActive = isSamePlace(city, location);

        return (
          <CircleMarker
            key={city.id}
            center={[city.lat, city.lon]}
            radius={isActive ? 9 : 6}
            pathOptions={{
              color: isActive ? "#d8c27a" : "#9b8cc9",
              fillColor: isActive ? "#d8c27a" : "#9b8cc9",
              fillOpacity: isActive ? 0.95 : 0.75,
              weight: isActive ? 3 : 2,
            }}
            eventHandlers={{
              click: () => {
                setLocation({
                  name: city.city,
                  country: city.country,
                  lat: city.lat,
                  lon: city.lon,
                });
              },
            }}
          >
            {isActive && (
              <Tooltip
                direction="top"
                offset={[0, -8]}
                opacity={1}
                permanent
                className="city-map-tooltip"
              >
                <span>{city.city}</span>
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}

      {!currentCityIsLargeCity && (
        <CircleMarker
          center={[location.lat, location.lon]}
          radius={9}
          pathOptions={{
            color: "#d8c27a",
            fillColor: "#d8c27a",
            fillOpacity: 0.95,
            weight: 3,
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -8]}
            opacity={1}
            permanent
            className="city-map-tooltip"
          >
            <span>{location.name}</span>
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
