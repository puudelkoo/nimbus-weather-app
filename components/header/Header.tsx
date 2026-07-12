"use client";

import Image from "next/image";
import { useLocation } from "@/context/LocationContext";
import CitySearchInput from "./CitySearchInput";
import { getAssetPath } from "@/utils/getAssetPath";

export default function Header() {
  const { location } = useLocation();

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* GÓRA / LEWA STRONA */}
      <div className="flex min-w-0 items-center gap-4">
        {/* Logo */}
        <div className="relative h-11 w-11 shrink-0 lg:h-12 lg:w-12">
          <Image
            src={getAssetPath("/logo2.png")}
            alt="Nimbus logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Nazwa + lokalizacja w jednym rzędzie */}
        <div className="flex min-w-0 items-center gap-16">
          <div className="shrink-0 text-xl font-semibold leading-none tracking-tight">
            Nimbus<span className="text-foreground/50">.</span>
          </div>

          <div className="flex min-w-0 items-center gap-2 text-sm text-foreground/75">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="shrink-0 text-accent"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M12 13.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
                fill="currentColor"
              />
            </svg>

            <span className="truncate whitespace-nowrap">
              {location.name}
              <span className="text-foreground/50">
                {location.country ? `, ${location.country}` : ""}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="w-full md:w-auto">
        <CitySearchInput />
      </div>
    </header>
  );
}
