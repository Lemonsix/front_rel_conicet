"use client";

import { EmbarcacionesTable } from "@/components/embarcaciones/embarcaciones-table";

export default function EmbarcacionesPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <h1 className="text-3xl font-bold p-4">Embarcaciones</h1>
      <EmbarcacionesTable />
    </div>
  );
}
