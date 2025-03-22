"use client";

import { CampaniasGrid } from "@/components/campanias/campanias-grid";

export default function CampaniasPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Campañas</h1>
      <CampaniasGrid />
    </div>
  );
}
