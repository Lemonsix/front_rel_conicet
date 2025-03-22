"use client";

import { CampaniasGrid } from "@/components/campanias/campanias-grid";

export default function CampaniasPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <h1 className="text-3xl font-bold p-4">Campañas</h1>
      <CampaniasGrid />
    </div>
  );
}
