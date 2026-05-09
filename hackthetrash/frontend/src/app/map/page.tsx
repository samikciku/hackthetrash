"use client";

import dynamic from "next/dynamic";

const PublicMap = dynamic(() => import("@/components/map/PublicMap"), {
  ssr: false,
  loading: () => <div className="p-8">Loading map…</div>
});

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-60px)]">
      <PublicMap />
    </div>
  );
}
