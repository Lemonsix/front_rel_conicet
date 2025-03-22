"use client";

import { PersonasTable } from "@/components/personas/personas-table";

export default function PersonasPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <h1 className="text-3xl font-bold p-4">Personas</h1>
      <PersonasTable />
    </div>
  );
}
