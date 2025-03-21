"use client"

import { EmbarcacionesTable } from "@/components/embarcaciones/embarcaciones-table"

export default function EmbarcacionesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Embarcaciones</h1>
      <EmbarcacionesTable />
    </div>
  )
}   