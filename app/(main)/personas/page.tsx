"use client"

import { PersonasTable } from "@/components/personas/personas-table"

export default function PersonasPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Personas</h1>
      <PersonasTable />
    </div>
  )
}