"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-2xl border border-surface/40 bg-surface/20" />
  ),
});

export default function GlobalMap() {
  return (
    <div className=" xl:col-span-8 min-[1780px]:col-span-9 flex flex-col rounded-2xl border border-surface/60 bg-surface/35 backdrop-blur p-6">
      <h2 className="text-lg font-semibold">Global map</h2>

      <div className="mt-4 flex-1 min-h-82.5 rounded-2xl overflow-hidden border border-surface/40">
        <Map />
      </div>
    </div>
  );
}
